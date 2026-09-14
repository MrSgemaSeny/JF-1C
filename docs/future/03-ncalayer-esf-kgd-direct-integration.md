# Архитектурный план интеграции: NCALayer WebSockets + Прямой шлюз ИС ЭСФ / КГД МФ РК

## 1. Теоретический базис казахстанской криптографии и ЭЦП

### 1.1. Законодательный статус и стандарты шифрования
В соответствии с Законом Республики Казахстан от 7 января 2003 года № 370-II «Об электронном документе и электронной цифровой подписи»:
- Электронная цифровая подпись (ЭЦП), выданная Национальным удостоверяющим центром РК (НУЦ РК), равнозначна собственноручной подписи физического лица либо уполномоченного лица юридического лица и влечет одинаковые юридические последствия.
- Криптографические стандарты РК:
  - **СТ РК 1073-2007** (на базе ГОСТ 34.310-2004) — алгоритм формирования и проверки ЭЦП.
  - **СТ РК ГОСТ Р 34.10-2015 / СТ РК 2.57-2021** — современные эллиптические кривые (ГОСТ 2015, ключи `GOSTKNCA`).
  - **ГОСТ 34.311-95** — функция хэширования.
- Структура ключевого контейнера НУЦ РК (формат PKCS#12 / .p12):
  - Ключ `AUTH_...` — используется исключительно для TLS-аутентификации и входа в систему.
  - Ключ `RSA_...` или `GOSTKNCA_...` — используется для юридически значимого подписания электронных документов, договоров, налоговых деклараций и пакетов счетов-фактур.

### 1.2. Механика работы NCALayer
Браузерные песочницы (Web Sandbox) запрещают прямой доступ JavaScript к файловой системе, реестру Windows/macOS и аппаратным токенам (Kaztoken, eToken, AKey, удостоверения личности РК).
Для обхода этого ограничения НУЦ РК разработал **NCALayer**:
- Локальное приложение-демон (Java/C++), запускаемое на машине пользователя.
- Поднимает локальный защищенный WebSocket-сервер по адресу `wss://127.0.0.1:13579/` (или резервный `ws://127.0.0.1:13579/`).
- Принимает JSON-RPC команды от веб-приложения, отображает системное нативное окно ОС для выбора хранилища ключей и ввода PIN-кода, подписывает хэш или Base64-содержимое документа на приватном ключе пользователя и возвращает подписанный CMS/PKCS#7 контейнер.

---

## 2. Архитектура интеграционного шлюза JF-1C

```mermaid
graph TD
    subgraph Browser ["Браузер клиента (React 19 / FSD)"]
        UI["Кнопка 'Подписать документ ЭЦП'"]
        Hook["useNCALayer (WebSocket Client)"]
    end

    subgraph UserMachine ["Локальная машина пользователя"]
        NCALayerApp["NCALayer Daemon (wss://127.0.0.1:13579)"]
        Hardware["Kaztoken / eToken / Файл .p12"]
    end

    subgraph Backend ["JF-1C Cloud Backend (Spring Boot 3)"]
        CryptoService["Kalkan Crypto Verification Service"]
        EsfGateway["ИС ЭСФ Gateway (SOAP Client)"]
        DocVault["Electronic Document Storage"]
    end

    subgraph StatePortals ["Государственные сервисы РК"]
        OCSP["OCSP НУЦ РК (ocsp.pki.gov.kz)"]
        ESF_PROD["Сервер ИС ЭСФ КГД МФ РК (esf.gov.kz)"]
    end

    UI -->|1. Запрос подписания| Hook
    Hook <-->|2. JSON-RPC (wss)| NCALayerApp
    NCALayerApp <-->|3. Ввод PIN-кода и чтение ключа| Hardware
    NCALayerApp -->>|4. Возврат CMS Signature Base64| Hook
    Hook -->|5. Отправка документа с подписью| CryptoService
    CryptoService -->|6. Проверка статуса отзыва сертификата| OCSP
    CryptoService -->|7. Сохранение валидного документа| DocVault
    DocVault -->|8. Регламентная отправка пакета ЭСФ| EsfGateway
    EsfGateway <-->|9. SOAP Mutual TLS + Session Token| ESF_PROD
```

---

## 3. Протокол взаимодействия с NCALayer по WebSockets

### 3.1. Запрос на формирование отсоединенной CMS-подписи (createCMSSignatureFromBase64)
Веб-интерфейс JF-1C подключается к сокету и отправляет команду:

```json
{
  "module": "kz.gov.pki.knca.commonUtils",
  "method": "createCMSSignatureFromBase64",
  "args": [
    "PKCS12",
    "SIGNATURE",
    "0J/QvtC00LHRgNC+0YHRgtGA0L7QtdC90L3Ri9C5INC00L7QutGD0LzQtdC90YIg0JfQsNGP0LLQutC4ICM4NTI=",
    true
  ]
}
```

*Параметры вызова:*
1. `PKCS12` — тип хранилища (или `AKKaztokenStore`, `EToken5110Store`).
2. `SIGNATURE` — назначение ключа (только ключ подписания, не ключ авторизации).
3. Base64-строка канонизированного XML-документа или хэша PDF-файла.
4. `true` — флаг отсоединенной подписи (Detached Signature: подпись возвращается отдельно от тела документа, что критично для экономии трафика и раздельного хранения).

### 3.2. Ответ от NCALayer
```json
{
  "code": "200",
  "message": null,
  "responseObject": "MIILeAYJKoZIhvcNAQcCoIIKZzCCCmMCAQExDzANBglghkgBZQMEAgEFADCCAaUGCSqGSIb3DQEHAaCCAZYEggGS..."
}
```

---

## 4. Верификация ЭЦП на бэкенде JF-1C (Spring Boot 3 + Kalkan Crypt)

### 4.1. Критерии строгой проверки юридической значимости
Бэкенд JF-1C не доверяет клиенту и обязан самостоятельно верифицировать полученную подпись перед фиксацией документа:
1. **Математическая валидность:** Соответствие подписи хэшу подписанных байт документа.
2. **Доверие цепочке сертификатов (Chain of Trust):** Сертификат подписанта должен быть выпущен корневым удостоверяющим центром НУЦ РК (`root_gost.cer`, `nca_gost.cer`).
3. **Срок действия:** Текущее системное время сервера должно укладываться в `NotBefore` и `NotAfter`.
4. **Проверка на отзыв (Revocation Check):**
   - Онлайн через OCSP-протокол (`http://ocsp.pki.gov.kz/`).
   - Офлайн через локально кэшируемые списки отозванных сертификатов (CRL, обновление каждые 2 часа).
5. **Соответствие субъекта (Identity Match):** Из расширений X.509 сертификата извлекаются OID:
   - `OID 2.5.4.5` (ИИН физического лица / директора).
   - `OID 2.5.4.11` (БИН организации).
   - БИН в сертификате обязан строго совпадать с БИН обслуживаемого клиента в базе данных JF-1C.

### 4.2. Java-сервис валидации подписи
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class KalkanSignatureValidationService {

    private final X509Certificate rootNcaCert;
    private final OcspClient ocspClient;

    public VerificationResult verifyCmsSignature(byte[] originalContent, String base64CmsSignature, String expectedBin) {
        try {
            byte[] signatureBytes = Base64.getDecoder().decode(base64CmsSignature);
            CMSSignedData signedData = new CMSSignedData(new CMSProcessableByteArray(originalContent), signatureBytes);

            SignerInformationStore signers = signedData.getSignerInformationStore();
            Collection<SignerInformation> signerCollection = signers.getSigners();

            if (signerCollection.isEmpty()) {
                return VerificationResult.invalid("CMS-контейнер не содержит подписантов");
            }

            SignerInformation signer = signerCollection.iterator().next();
            Store<X509CertificateHolder> certStore = signedData.getCertificates();
            Collection<X509CertificateHolder> certCollection = certStore.getMatches(signer.getSID());
            X509CertificateHolder certHolder = certCollection.iterator().next();
            
            X509Certificate signerCert = new JcaX509CertificateConverter().getCertificate(certHolder);

            // 1. Проверка срока действия
            signerCert.checkValidity();

            // 2. Математическая верификация подписи
            SignerInformationVerifier verifier = new JcaSimpleSignerInfoVerifierBuilder()
                    .setProvider("Kalkan")
                    .build(signerCert.getPublicKey());

            if (!signer.verify(verifier)) {
                return VerificationResult.invalid("Математическая проверка ЭЦП завершилась ошибкой");
            }

            // 3. Извлечение БИН / ИИН и проверка организации
            CertificateSubjectInfo subjectInfo = CertificateUtils.extractSubjectInfo(signerCert);
            if (!expectedBin.equals(subjectInfo.getBin())) {
                return VerificationResult.invalid(String.format(
                        "БИН сертификата (%s) не совпадает с БИН организации (%s)", 
                        subjectInfo.getBin(), expectedBin));
            }

            // 4. Проверка статуса отзыва через OCSP
            OcspStatus ocspStatus = ocspClient.checkRevocation(signerCert, rootNcaCert);
            if (ocspStatus != OcspStatus.GOOD) {
                return VerificationResult.invalid("Сертификат отозван в НУЦ РК (статус: " + ocspStatus + ")");
            }

            return VerificationResult.valid(subjectInfo);

        } catch (CertificateExpiredException | CertificateNotYetValidException ex) {
            return VerificationResult.invalid("Срок действия сертификата ЭЦП истек или еще не наступил");
        } catch (Exception ex) {
            log.error("Критический сбой при верификации ЭЦП: {}", ex.getMessage(), ex);
            return VerificationResult.invalid("Ошибка проверки структуры криптографической подписи");
        }
    }
}
```

---

## 5. Прямой шлюз обмена с ИС ЭСФ КГД МФ РК

### 5.1. Архитектура веб-сервисов ИС ЭСФ
ИС ЭСФ предоставляет официальный программный интерфейс на базе SOAP 1.2 с взаимной TLS-аутентификацией (Mutual TLS):
- Боевой хост: `https://esf.gov.kz:8443/esf-web/services/`
- Тестовый хост: `https://test3.esf.gov.kz:8443/esf-web/services/`
- Сервисы:
  1. `SessionService` — управление сессиями и получение токена авторизации.
  2. `InvoiceService` — пакетный прием, отзыв, аннулирование и выгрузка ЭСФ.

### 5.2. Процедура авторизации и сессионный цикл (Open Session Workflow)
1. JF-1C запрашивает случайную строку (challenge string) методом `SessionService.createSession()`.
2. Сервер ИС ЭСФ возвращает `sessionId` и `randomChallenge`.
3. JF-1C подписывает `randomChallenge` служебным системным сертификатом ЭЦП ТОО «ZhanFinance» (или ключом уполномоченного бухгалтера).
4. Метод `SessionService.confirmSession(sessionId, signedChallenge)` подтверждает подлинность и переводит сессию в статус `ACTIVE` с выдачей рабочего токена сессии (TTL 2 часа).

### 5.3. XML-схема и подписание электронного счета-фактуры
Счет-фактура формируется строго по XSD-схеме ИС ЭСФ (версия 2.0 / 3.0), канонизируется по алгоритму XML-DSig (C14N) и подписывается ЭЦП в формате Enveloped Signature:

```xml
<invoiceContainer xmlns="esf">
  <invoice>
    <date>09.09.2026</date>
    <invoiceType>ORDINARY_INVOICE</invoiceType>
    <num>ЗФ-00000841</num>
    <turnoverDate>09.09.2026</turnoverDate>
    <sellersHeader>
      <seller>
        <bin>240140023819</bin>
        <name>ТОО ZhanFinance</name>
        <certificateSeries>01001</certificateSeries>
        <certificateNum>0049182</certificateNum>
        <address>г. Алматы, ул. Достык, 180</address>
      </seller>
    </sellersHeader>
    <customersHeader>
      <customer>
        <bin>220940039182</bin>
        <name>ТОО Astana Digital Solutions</name>
        <address>г. Астана, ул. Мәңгілік Ел, 55/8</address>
      </customer>
    </customersHeader>
    <productSet>
      <products>
        <product>
          <description>Бухгалтерское сопровождение за август 2026 г.</description>
          <unitCode>796</unitCode>
          <quantity>1.0</quantity>
          <unitPrice>340000.00</unitPrice>
          <priceWithTax>340000.00</priceWithTax>
          <withoutTax>340000.00</withoutTax>
          <turnoverSize>340000.00</turnoverSize>
          <vatRate>WITHOUT_VAT</vatRate>
        </product>
      </products>
      <totalPriceWithTax>340000.00</totalPriceWithTax>
      <totalTurnoverSize>340000.00</totalTurnoverSize>
    </productSet>
  </invoice>
</invoiceContainer>
```

---

## 6. Frontend: Хук useNCALayer (React 19 / TypeScript)

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

interface NCALayerResponse {
  code: string;
  responseObject?: string;
  message?: string;
}

export function useNCALayer() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const connect = () => {
    try {
      const socket = new WebSocket('wss://127.0.0.1:13579/');
      
      socket.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      socket.onclose = () => {
        setIsConnected(false);
      };

      socket.onerror = () => {
        setIsConnected(false);
        setError('NCALayer не запущен. Пожалуйста, запустите приложение NCALayer на компьютере.');
      };

      wsRef.current = socket;
    } catch {
      setIsConnected(false);
      setError('Не удалось подключиться к локальному сокету NCALayer');
    }
  };

  const signData = useCallback((base64Data: string, storageType: string = 'PKCS12'): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('Соединение с NCALayer отсутствует'));
        return;
      }

      setIsSigning(true);

      const requestPayload = {
        module: 'kz.gov.pki.knca.commonUtils',
        method: 'createCMSSignatureFromBase64',
        args: [storageType, 'SIGNATURE', base64Data, true]
      };

      wsRef.current.onmessage = (event) => {
        setIsSigning(false);
        try {
          const response: NCALayerResponse = JSON.parse(event.data);
          if (response.code === '200' && response.responseObject) {
            resolve(response.responseObject);
          } else {
            reject(new Error(response.message || 'Пользователь отменил подписание'));
          }
        } catch (e) {
          reject(new Error('Некорректный ответ от NCALayer'));
        }
      };

      wsRef.current.send(JSON.stringify(requestPayload));
    });
  }, []);

  return { isConnected, isSigning, error, signData, reconnect: connect };
}
```

---

## 7. Этапы внедрения и план сертификации

1. **Этап 1: Подключение тестового стенда ИС ЭСФ (Недели 1-2)**
   - Получение тестовых ЭЦП на портале НУЦ РК (pki.gov.kz/test).
   - Регистрация учетной записи разработчика на стенде `test3.esf.gov.kz`.
   - Настройка SOAP-клиента Spring Boot с поддержкой алгоритмов ГОСТ.
2. **Этап 2: Браузерный модуль подписания (Недели 3-4)**
   - Интеграция хука `useNCALayer` в модальные окна согласования отчетов и актов.
   - Полноценная обработка отсутствия запущенного NCALayer с подсказками по установке.
   - Бэкенд-валидация отсоединенной CMS-подписи по корневым сертификатам НУЦ.
3. **Этап 3: Тестирование сквозного цикла выписки ЭСФ (Недели 5-6)**
   - Отправка пакетов ЭСФ из JF-1C на тестовый портал КГД.
   - Проверка автоматического присвоения регистрационных номеров ИС ЭСФ.
   - Переключение на продуктивный шлюз `esf.gov.kz` и промышленная эксплуатация.
