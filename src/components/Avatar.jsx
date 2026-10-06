export default function Avatar({ url, username, className, fallbackClassName }) {
  if (url) return <img className={className} src={url} alt="" />;
  return <span className={`${className} ${fallbackClassName || ""}`}>{(username || "?").charAt(0).toUpperCase()}</span>;
}
