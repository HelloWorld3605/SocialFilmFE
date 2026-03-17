const Footer = () => {
  return (
    <footer className="border-t border-border mt-10 py-10 px-6 md:px-16 bg-background/50 relative overflow-hidden">
      {/* Background Icon On The Right */}
      <div className="absolute right-[-100px] bottom-[-100px] pointer-events-none opacity-20 hidden md:block select-none">
        <img
          alt="footer background"
          loading="lazy"
          width="500"
          height="700"
          src="https://rophim.is/wp-content/themes/ophim-wp-theme-rophimme/assets/img/footer-icon.svg"
          className="w-[400px] xl:w-[500px] h-auto object-contain"
          style={{ color: "transparent" }}
        />
      </div>

      <div className="w-full max-w-7xl relative z-10 text-left flex flex-col items-start gap-8">
        {/* Vietnam Flag Banner */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3 w-fit">
          <img
            alt="Vietnam"
            loading="lazy"
            width="24"
            height="24"
            src="https://rophim.is/wp-content/themes/ophim-wp-theme-rophimme/assets/img/vn_flag.svg"
            className="shrink-0"
            style={{ color: "transparent" }}
          />
          <span className="font-semibold text-[#f3cd7b] text-sm md:text-base tracking-wide flex-start">
            Hoàng Sa &amp; Trường Sa là của Việt Nam!
          </span>
        </div>

        {/* Logo and Socials */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-start gap-6 xl:gap-10 w-full">
          <a href="/" className="shrink-0 self-start">
            <img
              className="h-12 w-auto object-contain"
              src="https://rophim.is/wp-content/uploads/2025/11/cropped-logo.png"
              alt="Rổ Phim"
            />
          </a>

          <div className="flex flex-wrap items-center justify-start gap-3">
            {[
              { href: "https://t.me/congdongrophim", title: "Telegram", img: "telegram-icon.svg" },
              { href: "https://discord.gg/rophim", title: "Discord", img: "discord-icon.svg" },
              { href: "https://x.com/rophimtv", title: "X", img: "x-icon.svg" },
              { href: "https://www.facebook.com/rogiaitri", title: "Facebook", img: "facebook-icon.svg" },
              { href: "https://www.tiktok.com/@rophimtv", title: "Tiktok", img: "tiktok-icon.svg" },
              { href: "https://www.youtube.com/@rophimcom", title: "Youtube", img: "youtube-icon.svg" },
              { href: "https://www.threads.net/@rophimtv", title: "Threads", img: "threads-icon.svg" },
              { href: "https://www.instagram.com/rophimtv", title: "Instagram", img: "instagram-icon.svg" },
            ].map((social) => (
              <a
                key={social.title}
                target="_blank"
                rel="noopener noreferrer"
                href={social.href}
                title={social.title}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 shadow-sm"
              >
                <img
                  alt={social.title}
                  loading="lazy"
                  width="20"
                  height="20"
                  src={`https://rophim.is/wp-content/themes/ophim-wp-theme-rophimme/assets/img/${social.img}`}
                  style={{ color: "transparent" }}
                  className="opacity-80 group-hover:opacity-100"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Links Menu */}
        <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-3 text-sm font-medium text-white/70 w-full">
          <a title="Hỏi-Đáp" href="#" className="hover:text-white hover:underline underline-offset-4 transition-all">Hỏi-Đáp</a>
          <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block"></span>
          <a title="Chính sách bảo mật" href="#" className="hover:text-white hover:underline underline-offset-4 transition-all">Chính sách bảo mật</a>
          <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block"></span>
          <a title="Điều khoản sử dụng" href="#" className="hover:text-white hover:underline underline-offset-4 transition-all">Điều khoản sử dụng</a>
          <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block"></span>
          <a title="Giới thiệu" href="#" className="hover:text-white hover:underline underline-offset-4 transition-all">Giới thiệu</a>
          <span className="w-1 h-1 rounded-full bg-white/20 hidden md:block"></span>
          <a title="Liên hệ" href="#" className="hover:text-white hover:underline underline-offset-4 transition-all">Liên hệ</a>
        </div>

        {/* Notice / Description */}
        <div className="text-sm text-white/50 leading-relaxed max-w-5xl text-left w-full relative z-10">
          RoPhim (Rổ Phim) - Phim hay cả rổ - trang xem phim online miễn phí Full HD Vietsub, thuyết minh + lồng tiếng. Kho phim mới khổng lồ, phim chiếu rạp, phim bộ, phim lẻ từ nhiều quốc gia như Việt Nam, Hàn Quốc, Trung Quốc, Thái Lan, Nhật Bản, Âu Mỹ… đa dạng thể loại. Khám phá nền tảng phim trực tuyến hay nhất 2025 chất lượng 4K!
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-white/10 text-xs text-white/40 font-medium w-full text-left">
          Copyright ©2025 Rophim
        </div>
      </div>
    </footer>
  );
};

export default Footer;
