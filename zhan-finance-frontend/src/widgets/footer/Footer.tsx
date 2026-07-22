import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, User, Briefcase, Send } from "lucide-react";
import { ContactForm } from "@/features/contact-form/ContactForm";
import { ROUTES } from "@/shared/config/routes";
import { useTranslation } from "react-i18next";
import LogoImage from "@/shared/assets/icons/logo.png";

export function Footer() {
  const { t } = useTranslation('common');
  return (
    <footer id="contact" className="bg-brand-green pt-24 pb-12 text-brand-beige rounded-t-[40px] mt-[-40px] relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 mb-20">
          <div className="space-y-12">
            <div>
              <img src={LogoImage} alt="Zhan Finance Logo" className="w-16 h-16 rounded-2xl object-contain mb-6 bg-white" />
              <h2 className="text-4xl md:text-5xl font-black uppercase leading-[1.1] tracking-tight">
                {t('footer.slogan1')}
                <br />
                {t('footer.slogan2')}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest text-sm opacity-50 mb-2">
                  {t('footer.navigation')}
                </h4>
                <ul className="space-y-3 font-medium">
                  <li>
                    <Link
                      to={ROUTES.HOME}
                      className="hover:text-white transition-colors"
                    >
                      {t('publicNav.home')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={ROUTES.SERVICES}
                      className="hover:text-white transition-colors"
                    >
                      {t('publicNav.services')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={ROUTES.ABOUT}
                      className="hover:text-white transition-colors"
                    >
                      {t('publicNav.about')}
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold uppercase tracking-widest text-sm opacity-50 mb-2">
                  {t('footer.contacts')}
                </h4>
                <ul className="space-y-4 font-medium">
                  <li>
                    <div className="flex flex-col gap-2">
                      <a
                        href="tel:+77759573787"
                        className="flex items-center gap-3 hover:text-white transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                        +7-775-957-37-87
                      </a>
                      <a
                        href="tel:+77252522309"
                        className="flex items-center gap-3 hover:text-white transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                        +7 (7252) 52-23-09
                      </a>
                      <a
                        href="tel:+77753855077"
                        className="flex items-center gap-3 hover:text-white transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                        +7-775-385-50-77
                      </a>
                    </div>
                  </li>
                  <li>
                    <a
                      href="mailto:zhan.finance@gmail.com"
                      className="flex items-center gap-3 hover:text-white transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      zhan.finance@gmail.com
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 shrink-0 mt-1" />
                    <span>
                      {t('footer.address')}
                      <br />
                      ЖАН FINANCE
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href="https://t.me/mrsgemaseny"
                className="w-12 h-12 rounded-full border border-brand-beige/20 flex items-center justify-center hover:bg-brand-beige hover:text-brand-green transition-all"
              >
                <User className="w-5 h-5" />
              </a>
              <a
                href="tel:+77759573787"
                className="w-12 h-12 rounded-full border border-brand-beige/20 flex items-center justify-center hover:bg-brand-beige hover:text-brand-green transition-all"
              >
                <Briefcase className="w-5 h-5" />
              </a>
              <a
                href="https://2gis.kz/shymkent/search/zhanfinance/firm/70000001060962340/69.629124%2C42.354754?m=69.629774%2C42.354893%2F16.83"
                className="w-12 h-12 rounded-full border border-brand-beige/20 flex items-center justify-center hover:bg-brand-beige hover:text-brand-green transition-all"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="bg-brand-beige text-brand-green p-8 md:p-12 rounded-[32px]">
            <ContactForm title={t('footer.discussTask')} />
          </div>
        </div>

        <div className="pt-8 border-t border-brand-beige/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium opacity-60">
          <p>© {new Date().getFullYear()} Zhan Finance. {t('footer.allRightsReserved')}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
