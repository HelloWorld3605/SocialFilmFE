import { Link } from "react-router-dom";
import {
  Film,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border mt-10 bg-background/95 pt-16 pb-8 layout-padding relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 xl:gap-16 mb-16">
        {/* Brand Column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <Film className="h-8 w-8 text-primary" />
            <span
              className="text-3xl font-bold tracking-wider text-primary"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              SocialFilm
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nền tảng giải trí trực tuyến hàng đầu, mang đến cho bạn những không
            gian điện ảnh đỉnh cao, đa dạng thể loại và chất lượng hình ảnh vượt
            trội. Trải nghiệm xem phim không giới hạn mọi lúc, mọi nơi.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:-translate-y-1"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:-translate-y-1"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:-translate-y-1"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:-translate-y-1"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-foreground">
            Top Thể Loại
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Phim Hành Động
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Phim Khoa Học Viễn Tưởng
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Phim Kinh Dị
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Phim Hài Hước
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Anime Trending
              </a>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-foreground">
            Hỗ Trợ & Chính Sách
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Gói Đăng Ký Trả Phí
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Trung Tâm Trợ Giúp
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Câu Hỏi Thường Gặp (FAQ)
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Điều Khoản Sử Dụng
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all font-bold" />
                Chính Sách Bảo Mật
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="flex flex-col gap-6">
          <h3 className="text-lg font-semibold text-foreground">Liên Hệ</h3>
          <ul className="flex flex-col gap-4 text-sm text-muted-foreground">
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span className="mt-1">
                123 Đại Lộ Điện Ảnh, Quận 1, TP. Hồ Chí Minh
              </span>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <span>+84 123 456 789</span>
            </li>
            <li className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span>contact@socialfilm.vn</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="w-full relative z-10 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center md:text-left">
          &copy; {new Date().getFullYear()} SocialFilm. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">
            Điều khoản bổ sung
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Chính sách bảo mật
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
