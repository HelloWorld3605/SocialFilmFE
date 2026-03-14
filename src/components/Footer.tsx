const Footer = () => {
  return (
    <footer className="border-t border-border mt-10 py-10 px-6 md:px-16 text-center">
      <h2 className="text-xl font-bold tracking-widest text-foreground mb-6">AGENCY</h2>
      <div className="flex items-center justify-center gap-4 md:gap-8 text-sm text-muted-foreground flex-wrap">
        {["About us", "Vlog", "Contact", "Report broken links", "Disclaimer"].map((link, i) => (
          <span key={link} className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">{link}</a>
            {i < 4 && <span className="text-border">|</span>}
          </span>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
