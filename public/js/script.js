window.onload = () => {
    async function ConvertCSVTOJSON(filename) {
        await fetch(`${window.location.href}convert-csv-to-json`, { body: JSON.stringify({ filename }), method: "POST", headers: { "Content-Type": "application/json" } }).catch((err) => {
            console.log(err)
        });
    }

    document.querySelectorAll(".csv-to-json").forEach((button) => {
        button.addEventListener("click", (e) => {
            const filename = e.target.getAttribute("param");
            e.target.innerText = "Converting to JSON...";
            ConvertCSVTOJSON(filename).then(val => {
                e.target.innerText = "Converted to JSON file"
            });

        })
    })
}