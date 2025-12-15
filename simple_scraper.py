import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

HEADERS = {
    "User-Agent": "NewsSignalBot/1.0 (respectful)"
}

def scrape_article(url):
    # 1️⃣ Fetch
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    html = response.text

    soup = BeautifulSoup(html, "html.parser")

    # 2️⃣ TITLE (try h1 first, fallback to title tag)
    title = None
    if soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)
    elif soup.title:
        title = soup.title.get_text(strip=True)
    else:
        title = "Unknown Title"

    # 3️⃣ ARTICLE TEXT (generic approach)
    paragraphs = []

    for p in soup.find_all("p"):
        text = p.get_text(strip=True)
        if len(text) > 50:  # ignore nav / junk
            paragraphs.append(text)

    article_text = " ".join(paragraphs[:40])  # limit size

    # 4️⃣ SOURCE (domain)
    source = urlparse(url).netloc.replace("www.", "")

    return {
        "title": title,
        "article": article_text,
        "source": source,
        "url": url
    }


# 🧪 TEST IT
if __name__ == "__main__":
    test_url = "https://www.bbc.com/news/technology"
    data = scrape_article(test_url)

    print("\nTITLE:\n", data["title"])
    print("\nSOURCE:\n", data["source"])
    print("\nARTICLE PREVIEW:\n", data["article"][:1000])
