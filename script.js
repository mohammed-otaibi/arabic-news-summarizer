async function fetchNews() {
    const keywordInput = document.getElementById("keyword");
    const newsContainer = document.getElementById("news-container");
    const responseContainer = document.getElementById("response-container");

    const keyword = keywordInput.value.trim();
    if (!keyword) {
        newsContainer.textContent = "يرجى إدخال كلمة مفتاحية.";
        return;
    }

    newsContainer.textContent = "جلب الأخبار...";
    responseContainer.textContent = "بانتظار التلخيص...";

    try {
        const response = await fetch("http://localhost:3000/get-news", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ keyword })
        });

        if (!response.ok) {
            throw new Error(`خطأ: ${response.status}`);
        }

        const data = await response.json();

        if (!data.articles.length) {
            newsContainer.textContent = "لم يتم العثور على أخبار.";
            return;
        }

        // عرض الأخبار في الصفحة
        newsContainer.innerHTML = data.articles.map(article =>
            `<p><strong>${article.title}</strong><br>${article.description || "لا يوجد وصف متاح."}</p>`
        ).join("");

        // طلب تلخيص الأخبار
        summarizeNews(data.articles.map(article => article.title + " - " + (article.description || "")).join("\n\n"));

    } catch (error) {
        console.error(error);
        newsContainer.textContent = "حدث خطأ أثناء جلب الأخبار.";
    }
}

async function summarizeNews(newsText) {
    const responseContainer = document.getElementById("response-container");

    try {
        const response = await fetch("http://localhost:3000/summarize-news", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ newsText })
        });

        if (!response.ok) {
            throw new Error(`خطأ: ${response.status}`);
        }

        const data = await response.json();
        const rawSummary = data.summary;

        // 🔹 تحويل كل فقرة إلى عنصر <li> داخل <ul>
        const formattedSummary = rawSummary
            .split(" **") // تقسيم الجمل عند بداية العناوين
            .filter(item => item.trim() !== "") // إزالة الفقرات الفارغة
            .map(item => {
                const parts = item.split("**:"); // استخراج العنوان والنص
                const title = parts[0].trim();
                const content = parts.slice(1).join("**:").trim(); // قد يكون هناك ":" داخل النص
                return `<li><strong>${title}</strong>: ${content}</li>`;
            })
            .join(""); // دمج كل العناصر في HTML

        responseContainer.innerHTML = `
            <p><strong>📰 ملخص الأخبار:</strong></p>
            <ul>${formattedSummary}</ul>
        `;

    } catch (error) {
        console.error(error);
        responseContainer.textContent = "حدث خطأ أثناء تلخيص الأخبار.";
    }
}

