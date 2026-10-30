"""Stitches parts/ into one self-contained index.html.
  parts/base.css  layout + animation engine (from the Glädje / Glover's format)
  parts/brew.css  Fly Me to the Brew colors + new components (loaded after base, so it wins)
  parts/body.html page markup      parts/script.js  behaviour (hours + 1.5 s sliders live here)
Run:  python3 build.py     -> writes index.html (images inlined as base64) + index.dev.html (links to assets/)"""
import base64, re, pathlib
root = pathlib.Path(__file__).parent
p = lambda n: (root / "parts" / n).read_text(encoding="utf-8")

head = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add('js')</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fly Me to the Brew · Coffee, Chai &amp; Matcha Inside the YMCA · Orlando</title>
<meta name="description" content="Fly Me to the Brew is a coffee stand inside the YMCA lobby at 9055 Northlake Pkwy, Orlando. Handcrafted coffee, chai, matcha and hot chocolate, hot or cold. 5.0 on Google. Open six days a week.">
<meta name="theme-color" content="#2851D8">
<meta property="og:title" content="Fly Me to the Brew · Orlando">
<meta property="og:description" content="Handcrafted coffee, chai, matcha and hot chocolate, hot or cold, inside the YMCA lobby on Northlake Pkwy.">
<link rel="icon" href="assets/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Yellowtail&display=swap" rel="stylesheet">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"CafeOrCoffeeShop","name":"Fly Me to the Brew","address":{"@type":"PostalAddress","streetAddress":"9055 Northlake Pkwy (YMCA lobby)","addressLocality":"Orlando","addressRegion":"FL","postalCode":"32827"},
"sameAs":["https://www.instagram.com/flyme2thebrew/"],"servesCuisine":"Coffee","aggregateRating":{"@type":"AggregateRating","ratingValue":"5.0","reviewCount":"2"},
"openingHoursSpecification":[
{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday"],"opens":"06:00","closes":"11:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":["Wednesday","Thursday"],"opens":"09:30","closes":"19:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":"Friday","opens":"09:30","closes":"13:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":"Friday","opens":"16:00","closes":"19:00"},
{"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"08:00","closes":"14:00"}]}
</script>
<style>
""" + p("base.css") + "\n" + p("brew.css") + """
</style>
</head>
<body>
""" + p("body.html") + "\n<script>\n" + p("script.js") + "\n</script>\n</body>\n</html>\n"

(root / "index.dev.html").write_text(head, encoding="utf-8")
MIME = {".png": "image/png", ".svg": "image/svg+xml"}
uri = lambda f: f"data:{MIME.get(f.suffix, 'image/jpeg')};base64,{base64.b64encode(f.read_bytes()).decode()}"
pat = re.compile(r'(src|href)="(assets/[^"]+\.(?:png|jpg|svg))"')
uses = {}
for m in pat.finditer(head): uses[m.group(2)] = uses.get(m.group(2), 0) + 1
# an image used several times (e.g. the latte cutout) is stored ONCE in a script and
# copied into each <img> on load, so the file doesn't carry 4 copies of it
shared = sorted(k for k, c in uses.items() if c > 1 and not k.endswith(".svg"))
def swap(m):
    if m.group(2) in shared and m.group(1) == "src": return f'src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-a="{m.group(2)}"'
    return f'{m.group(1)}="{uri(root / m.group(2))}"'
out = pat.sub(swap, head)
lib = "const A=" + str({k: uri(root / k) for k in shared}).replace("'", '"') + ";document.querySelectorAll('img[data-a]').forEach(i=>{i.src=A[i.dataset.a]});"
out = out.replace("</body>", "<script>" + lib + "</script>\n</body>")
(root / "index.html").write_text(out, encoding="utf-8")
print("index.html", round(len(out) / 1e6, 2), "MB")
