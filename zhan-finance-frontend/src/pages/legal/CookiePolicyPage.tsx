import { Header } from '@/widgets/header/Header';
import { Footer } from '@/widgets/footer/Footer';
import { Cookie, ShieldCheck, Sliders, ExternalLink } from 'lucide-react';

export function CookiePolicyPage() {
  return (
    <>
      <Header />
      <main className="bg-brand-beige min-h-screen pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header Banner */}
          <div className="bg-brand-green text-brand-beige rounded-3xl p-8 md:p-12 mb-10 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-beige/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-beige/90 mb-4">
                <Cookie className="w-4 h-4" />
                Техническая прозрачность
              </div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
                Политика использования файлов Cookie
              </h1>
              <p className="text-brand-beige/80 text-base md:text-lg max-w-2xl">
                Информация о том, какие файлы cookie и технологии локального хранения используются платформой ZhanFinance, для чего они нужны и как вы можете ими управлять.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-brand-beige/60">
                <span>Дата обновления: 1 сентября 2026 г.</span>
                <span>•</span>
                <span>Редакция: 1.1</span>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-brand-green/10 text-brand-green/90 space-y-10 leading-relaxed font-normal">

            {/* 1. Что такое cookie */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">1</span>
                Что такое файлы cookie и локальное хранилище
              </h2>
              <p>
                1.1. Файлы cookie (куки) — это небольшие фрагменты данных, отправляемые веб-сервером и сохраняемые на вашем устройстве (компьютере, планшете или телефоне). Они помогают платформе запомнить ваши предпочтения и обеспечивают безопасную авторизацию.
              </p>
              <p>
                1.2. Наряду с cookie платформа ZhanFinance использует современное веб-хранилище браузера (LocalStorage и SessionStorage) исключительно для сохранения языковых настроек и визуального комфорта работы.
              </p>
            </section>

            {/* 2. Используемые файлы */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">2</span>
                Перечень используемых cookies и параметров хранения
              </h2>
              <p>
                Мы придерживаемся принципа минимизации данных и не используем сторонние рекламные трекеры. Ниже приведен исчерпывающий перечень технических идентификаторов:
              </p>

              <div className="overflow-x-auto rounded-2xl border border-brand-green/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-brand-green text-brand-beige uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Имя / Ключ</th>
                      <th className="py-3.5 px-4 font-bold">Тип</th>
                      <th className="py-3.5 px-4 font-bold">Срок действия</th>
                      <th className="py-3.5 px-4 font-bold">Назначение</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-green/10">
                    <tr className="hover:bg-brand-green/5">
                      <td className="py-3 px-4 font-mono font-bold text-brand-green">refreshToken</td>
                      <td className="py-3 px-4">HttpOnly Cookie (Secure)</td>
                      <td className="py-3 px-4">до 30 дней</td>
                      <td className="py-3 px-4">Строго обязательный. Автоматическое обновление сессии без повторного ввода пароля. Защищен от чтения JavaScript (XSS-защита).</td>
                    </tr>
                    <tr className="hover:bg-brand-green/5">
                      <td className="py-3 px-4 font-mono font-bold text-brand-green">cookie_consent</td>
                      <td className="py-3 px-4">LocalStorage</td>
                      <td className="py-3 px-4">1 год</td>
                      <td className="py-3 px-4">Фиксация согласия пользователя с правилами использования cookies.</td>
                    </tr>
                    <tr className="hover:bg-brand-green/5">
                      <td className="py-3 px-4 font-mono font-bold text-brand-green">i18nextLng</td>
                      <td className="py-3 px-4">LocalStorage</td>
                      <td className="py-3 px-4">1 год</td>
                      <td className="py-3 px-4">Сохранение выбранного языка интерфейса (русский, казахский, английский).</td>
                    </tr>
                    <tr className="hover:bg-brand-green/5">
                      <td className="py-3 px-4 font-mono font-bold text-brand-green">theme</td>
                      <td className="py-3 px-4">LocalStorage</td>
                      <td className="py-3 px-4">Бессрочно</td>
                      <td className="py-3 px-4">Пользовательские предпочтения оформления интерфейса.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Категории cookies */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">3</span>
                Категории используемых файлов
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-brand-green/10 bg-brand-beige/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-brand-green text-sm">
                    <ShieldCheck className="w-4 h-4 text-brand-green shrink-0" />
                    Строго необходимые (Essential)
                  </div>
                  <p className="text-xs text-brand-green/80">
                    Необходимы для функционирования платформы, входа в личный кабинет, защиты от CSRF-атак и шифрования сессий. Без них сервис не может работать корректно.
                  </p>
                </div>
                <div className="p-5 rounded-2xl border border-brand-green/10 bg-brand-beige/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-brand-green text-sm">
                    <Sliders className="w-4 h-4 text-brand-green shrink-0" />
                    Функциональные (Functional)
                  </div>
                  <p className="text-xs text-brand-green/80">
                    Позволяют запомнить выбранный язык и настройки представления задач. Не отслеживают ваши действия за пределами ZhanFinance.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Как отключить */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-brand-green/10 text-brand-green text-sm flex items-center justify-center font-bold">4</span>
                Управление файлами cookie в браузере
              </h2>
              <p>
                Вы можете настроить свой браузер так, чтобы он блокировал все или некоторые файлы cookie, либо уведомлял вас при их отправке. Обратите внимание: отключение строго необходимых cookies приведет к невозможности авторизации в личном кабинете.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-brand-green/10 bg-brand-green/5 hover:bg-brand-green/10 transition-colors flex items-center justify-between"
                >
                  <span className="font-bold text-brand-green">Google Chrome</span>
                  <ExternalLink className="w-3.5 h-3.5 text-brand-green/60" />
                </a>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-brand-green/10 bg-brand-green/5 hover:bg-brand-green/10 transition-colors flex items-center justify-between"
                >
                  <span className="font-bold text-brand-green">Apple Safari</span>
                  <ExternalLink className="w-3.5 h-3.5 text-brand-green/60" />
                </a>
                <a
                  href="https://support.mozilla.org/ru/kb/kuki-informaciya-kotoruyu-veb-sajty-sohranyayut-na-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-brand-green/10 bg-brand-green/5 hover:bg-brand-green/10 transition-colors flex items-center justify-between"
                >
                  <span className="font-bold text-brand-green">Mozilla Firefox</span>
                  <ExternalLink className="w-3.5 h-3.5 text-brand-green/60" />
                </a>
                <a
                  href="https://support.microsoft.com/ru-ru/microsoft-edge/%D1%83%D0%B4%D0%B0%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5-%D1%84%D0%B0%D0%B9%D0%BB%D0%BE%D0%B2-cookie-%D0%B2-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-brand-green/10 bg-brand-green/5 hover:bg-brand-green/10 transition-colors flex items-center justify-between"
                >
                  <span className="font-bold text-brand-green">Microsoft Edge</span>
                  <ExternalLink className="w-3.5 h-3.5 text-brand-green/60" />
                </a>
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
