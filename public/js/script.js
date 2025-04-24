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

    document.querySelectorAll(".clean-dataset-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const filename = e.target.parentElement.getAttribute("param");
            console.log("click:", filename);
            const selectedDataset = document.querySelector("#selected-dataset");
            selectedDataset.innerText = filename;
            const btn = document.createElement("button");
            btn.textContent = "analyze";
            selectedDataset.appendChild(btn)
            selectedDataset.classList.remove("invisible");
        })
    })
}