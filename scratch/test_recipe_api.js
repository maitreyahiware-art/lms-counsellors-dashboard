const API_URL = "https://bn-new-api.balancenutritiononline.com/api/v1/recipe/all";
const API_HEADERS = {
  "source": "cs_db",
  "Content-Type": "application/json",
  "Cookie": "connect.sid=s%3ARfynDp4c9t-DRbRgaKoT606qIqMZoYVD.TJ9LnjwK%2FHJdnfiCzRNKZPSf2oBBL3TMCbatvIcp7Ew",
};

async function test() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify({ page: 1, limit: 1 }),
  });
  const json = await res.json();
  const item = json[0]?.data?.[0];
  if (item) {
    console.log("Slug:", item.slug);
    console.log("Category:", item.category);
    console.log("Category Name:", item.category_name);
    console.log("Sub Category Name:", item.sub_category_name);
  } else {
    console.log("No item found");
  }
}

test();
