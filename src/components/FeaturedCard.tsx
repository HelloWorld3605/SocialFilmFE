import { Play, Plus, Star } from "lucide-react";
import featuredBg from "@/assets/featured-bg.jpg";
import { motion } from "framer-motion";

const FeaturedCard = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-6 md:mx-16 my-10 rounded-xl overflow-hidden relative"
    >
      <img
        src={featuredBg}
        alt="Featured series"
        className="w-full h-[350px] md:h-[400px] object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <span className="px-2 py-0.5 bg-destructive/80 text-foreground rounded text-xs font-bold">16</span>
          <span>2022</span>
          <span>2 Seasons</span>
          <div className="flex items-center gap-0.5 ml-2">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-3 h-3 fill-star text-star" />
            ))}
          </div>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">House of the Dragon</h3>
        <p className="text-sm text-muted-foreground max-w-lg mb-4 leading-relaxed">
          Lorem ipsum dolor sit amet consectetur. Rutrum ultrices amet cursus hac viverra semper tincidunt condimentum.
        </p>

        <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Infomations</a>
          <a href="#" className="hover:text-foreground transition-colors">Trailer</a>
          <a href="#" className="hover:text-foreground transition-colors">Reviews</a>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            <Play className="w-4 h-4 fill-current" />
            Watch
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 text-foreground text-sm font-medium hover:text-primary transition-colors">
            <Plus className="w-4 h-4" />
            MY LIST
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturedCard;
