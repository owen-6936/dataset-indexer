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
            selectedDataset.appendChild(btn);
            selectedDataset.classList.remove("invisible");
            btn.addEventListener("click", (e) => {
                btn.textContent = "analyzing..";
                fetch("/index-field/" + filename,
                ).then(async val => {
                    if (val.status === 200) {
                        btn.textContent = "analysis completed..";
                        const object = await val.json();
                        const objectKeys = await object.objectKeys;
                        const indexFields = document.getElementById("index-fields");
                        objectKeys.forEach(key => {
                            const div = document.createElement("div");
                            const input = document.createElement("input");
                            input.type = "checkbox";
                            input.id = key;
                            const label = document.createElement("label");
                            label.textContent = key;
                            label.setAttribute("for", key);
                            div.append(...[input, label]);
                            indexFields.appendChild(div);
                        })
                    }
                    else { btn.textContent = "analysis failed.." };
                }).catch(() => {
                    console.log("an error occured analyzing the file")
                })
            })
        })
    })
}