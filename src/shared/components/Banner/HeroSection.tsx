import { useRef, useState } from "react";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Dữ liệu mẫu
const popularMovies = [
  {
    _id: "e417e85606b3fc0cdab5f65d721f2ee0",
    name: "Trục Ngọc",
    origin_name: "Pursuit Of Jade",
    poster_url:
      "https://phimimg.com/upload/vod/20260307-1/7e5b11b1d5ce3514f6d62787d164b816.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260307-1/81572d43eddf1dc784f3f53f6323f46d.jpg",
    episode_current: "Tập 24",
    quality: "FHD",
    lang: "Vietsub + Thuyết Minh",
    year: 2026,
  },
  {
    _id: "8301854f418d355675f6366dc08573f6",
    name: "Đồi Gió Hú",
    origin_name: "Wuthering Heights",
    poster_url:
      "https://phimimg.com/upload/vod/20260315-1/acb91621df63910c25e0ebac8cb2019a.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260315-1/6ee95a5ca97e71e679306585b716fe44.jpg",
    episode_current: "Full",
    quality: "FHD",
    lang: "Vietsub",
    year: 2026,
  },
  {
    _id: "b084182f10cd8031300234c7551ef710",
    name: "Thiếu Niên Bạc Tỉ",
    origin_name: "The Billionaire",
    poster_url:
      "https://phimimg.com/upload/vod/20260316-1/d5b36b32a80745b8c319c39b56888b05.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260316-1/165f40d7ae25a0c65de82b7345762cf7.jpg",
    episode_current: "Full",
    quality: "FHD",
    lang: "Vietsub",
    year: 2011,
  },
  {
    _id: "fc5bbeb3f3a9051f9c7f3cf8b77434fb",
    name: "Siêu Nhân Điện Quang Geed",
    origin_name: "Ultraman Geed",
    poster_url:
      "https://phimimg.com/upload/vod/20260117-1/bbd4d9a16c358ee0a636d8f57dc5aa19.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260117-1/03b8c8e38e8fd2640a9f7b2a9a14312c.jpg",
    episode_current: "Tập 18",
    quality: "FHD",
    lang: "Vietsub + Lồng Tiếng",
    year: 2017,
  },
  {
    _id: "292f0300bbddb5ad9efc10f31c452e57",
    name: "Trâm Khoá Tình",
    origin_name: "The Inescapable",
    poster_url:
      "https://phimimg.com/upload/vod/20260309-1/d2a60306fcc9d2a518dd80def617dd95.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260309-1/872ed7e913666c2336ccd9f118accb78.jpg",
    episode_current: "Tập 21",
    quality: "FHD",
    lang: "Vietsub",
    year: 2026,
  },
  {
    _id: "4367fac13a0c0b12eabbd2f483581b2a",
    name: "Trăng Chiều Rực Rỡ",
    origin_name: "In The Clear Moonlit Dusk",
    poster_url:
      "https://phimimg.com/upload/vod/20260113-1/e2b63c3c759af96194e8d24d35228bcd.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260113-1/f8b8e380c7706cc6437b74f832ffbfc9.jpg",
    episode_current: "Tập 10",
    quality: "FHD",
    lang: "Vietsub",
    year: 2026,
  },
  {
    _id: "c841b23266e204fc9271733469516275",
    name: "Nữ Phản Diện Được Hoàng Tử Nước Láng Giềng Yêu Mến",
    origin_name:
      "The Villainess Is Adored by the Prince of the Neighbor Kingdom",
    poster_url:
      "https://phimimg.com/upload/vod/20260114-1/91ee78b105a7f89504686b54e3aad4d2.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260114-1/ed13ec167659375eabecf986662cfe12.jpg",
    episode_current: "Tập 10",
    quality: "FHD",
    lang: "Vietsub",
    year: 2026,
  },
  {
    _id: "68ff9c82826dcda9030b6b0990efc033",
    name: "Thám Tử Lừng Danh Conan",
    origin_name: "Detective Conan",
    poster_url:
      "https://phimimg.com/upload/vod/20240310-1/025424cf62248b9a7b54279ef5416e26.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20240310-1/2a39971cc29c2802259b918eb437a45b.jpg",
    episode_current: "Tập 1193",
    quality: "FHD",
    lang: "Vietsub + Lồng Tiếng",
    year: 1996,
  },
  {
    _id: "991becb4d6456d01dad848301495f0ea",
    name: "Tử Khoản",
    origin_name: "Dead Account",
    poster_url:
      "https://phimimg.com/upload/vod/20260113-1/f08d56e30aae2c66237412ef5f7d9a64.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260113-1/c425695aff7590f7d643a28cd1854366.jpg",
    episode_current: "Tập 10",
    quality: "FHD",
    lang: "Vietsub",
    year: 2026,
  },
  {
    _id: "90f5c2fca26cdc32f97373bba4c0c337",
    name: "Tojima Muốn Trở Thành Kamen Rider",
    origin_name: "Tojima Wants to Be a Kamen Rider",
    poster_url:
      "https://phimimg.com/upload/vod/20251012-1/ab37bc050815973d60ffa23caf1008b6.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20251012-1/713fa72d94ec3ccc5d50d8498aba149d.jpg",
    episode_current: "Tập 23",
    quality: "FHD",
    lang: "Vietsub",
    year: 2025,
  },
  {
    _id: "1fee5d8b6b5230e47fc933334d03ff5b",
    name: "Tình Yêu Bọ Xít",
    origin_name: "Duang With You",
    poster_url:
      "https://phimimg.com/upload/vod/20260203-1/4f012b3b1425ea6f159faeede915d199.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260203-1/610ef761198897ffbf87df213991bb66.jpg",
    episode_current: "Tập 7",
    quality: "FHD",
    lang: "Vietsub",
    year: 2026,
  },
  {
    _id: "1b96773a6c08eb3441a9827be8972ea2",
    name: "SI-VIS: Tiếng Vọng Của Anh Hùng",
    origin_name: "SI-VIS: The Sound Of Heroes",
    poster_url:
      "https://phimimg.com/upload/vod/20251012-1/f6e14e937f422646d867cc63535bc9d6.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20251012-1/025a04f41e2e0b7c2f1cec6df4d3ecb6.jpg",
    episode_current: "Tập 22",
    quality: "FHD",
    lang: "Vietsub",
    year: 2025,
  },
  {
    _id: "8424248303304cda787d00ef2732f8f0",
    name: "Siêu Cảnh Sát Vũ Trụ Gavan Infinity",
    origin_name: "Super Space Sheriff Gavan Infinity",
    poster_url:
      "https://phimimg.com/upload/vod/20260228-1/880269004d7c97f22c21b9073695eae9.jpg",
    thumb_url:
      "https://phimimg.com/upload/vod/20260228-1/5b3b0a72ea5e8d9f8bc9d0d276bca3b3.jpg",
    episode_current: "Tập 5",
    quality: "FHD",
    lang: "Vietsub + Lồng Tiếng",
    year: 2026,
  },
];

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMovie = popularMovies[activeIndex];
  const carouselRef = useRef<HTMLDivElement>(null);
  const movieCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const navigate = useNavigate();

  const setActiveMovieByIndex = (index: number) => {
    const targetCard = movieCardRefs.current[index];

    setActiveIndex(index);

    if (!targetCard) {
      return;
    }

    targetCard.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const scrollCarousel = (direction: "left" | "right") => {
    const delta = direction === "left" ? -1 : 1;
    const nextIndex = Math.min(
      Math.max(activeIndex + delta, 0),
      popularMovies.length - 1,
    );

    if (nextIndex === activeIndex) {
      return;
    }

    setActiveMovieByIndex(nextIndex);
  };

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background Image transitions when activeMovie changes */}
      <div className="absolute inset-0 transition-opacity duration-700 ease-in-out z-0">
        <img
          key={activeMovie._id}
          src={activeMovie.thumb_url}
          alt={activeMovie.name}
          className="absolute inset-0 w-full h-full object-cover object-[center_10%] animate-in fade-in duration-700"
        />
      </div>

      {/* Pattern Overlay*/}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0, 0, 0, 0.2) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-background/90 via-background/0 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-background/95 via-background/0 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-background/50 via-transparent to-transparent pointer-events-none h-32" />

      {/* Main Content Info */}
      <div className="relative z-10 flex flex-col justify-end h-full layout-padding pb-12 w-full max-w-[70%]">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground text-shadow-hero leading-none mb-2">
          {activeMovie.name}
        </h2>
        <p className="text-lg md:text-xl lg:text-2xl font-bold text-foreground/90 text-shadow-hero mb-4">
          {activeMovie.origin_name} ({activeMovie.year})
        </p>

        <div className="flex items-center gap-3 mb-4 text-sm font-medium">
          <span className="bg-primary/20 text-primary px-2.5 py-1 rounded-md">
            {activeMovie.quality}
          </span>
          <span className="text-foreground/80">
            {activeMovie.episode_current}
          </span>
          <span className="text-foreground/80">{activeMovie.lang}</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-sm font-semibold text-base hover:scale-105 transition-transform shadow-lg">
            <Play className="w-5 h-5 fill-current" />
            Xem ngay
          </button>
          <button
            onClick={() => navigate(`/movie/${activeMovie._id}`)}
            className="flex items-center gap-2 px-8 py-3.5 bg-foreground/20 backdrop-blur-md border tracking-wide border-foreground/30 text-foreground rounded-sm font-medium text-base hover:bg-foreground/30 transition-colors shadow-lg"
          >
            <Info className="w-5 h-5" />
            Chi tiết
          </button>
        </div>
      </div>

      {/* Popular Movies Carousel overlaying the bottom right of hero banner */}
      <div className="absolute right-0 md:right-8 lg:right-16 bottom-2 z-20 w-full md:w-[70%] lg:w-[60%] xl:w-[50%]">
        <div className="w-full relative">
          <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-5 -right-5 lg:-left-12 lg:-right-12 z-30 hidden md:flex items-center justify-between">
            <button
              type="button"
              onClick={() => scrollCarousel("left")}
              aria-label="Scroll movies left"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/30 bg-background/70 text-foreground backdrop-blur-md transition-colors hover:bg-background/90"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("right")}
              aria-label="Scroll movies right"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/30 bg-background/70 text-foreground backdrop-blur-md transition-colors hover:bg-background/90"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pt-10 pb-4 px-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="w-6 md:w-8 flex-none" />

            {popularMovies.map((movie, index) => (
              <div
                key={movie._id}
                ref={(el) => {
                  movieCardRefs.current[index] = el;
                }}
                onClick={() => setActiveMovieByIndex(index)}
                className={`relative flex-none w-[100px] md:w-[120px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer snap-start transition-all duration-300 transform-gpu ${index === 0 ? "origin-left" : "origin-center"} ${activeIndex === index ? "scale-[1.15] z-10 mx-3 shadow-xl" : "hover:scale-105"}`}
              >
                <img
                  src={movie.poster_url}
                  alt={movie.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-2 z-20">
                  <p className="text-white text-xs font-medium line-clamp-1 pointer-events-none">
                    {movie.name}
                  </p>
                </div>
              </div>
            ))}

            <div className="w-8 flex-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
