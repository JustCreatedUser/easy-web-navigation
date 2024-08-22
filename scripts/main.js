"use strict";
const db = (function () {
    try {
        let neededDB = JSON.parse(localStorage.db);
        return neededDB;
    }
    catch (_a) {
        if (localStorage) {
        }
        else {
            alert("The internet connection is worthless or your browser is too old. Update it or use a different one.");
        }
        return [];
    }
})(), allMutableGroups = (function () {
    try {
        let neededGroups = JSON.parse(localStorage.getItem("allMutableGroups"));
        if (neededGroups.length == 0) {
            throw new Error("groups are empty");
        }
        return neededGroups;
    }
    catch (_a) {
        const groups = (() => {
            const groups = Array.from(new Set(db.reduce((allGroups, link) => {
                allGroups.push(link.group);
                return allGroups;
            }, [])));
            if (groups.includes("Ungrouped")) {
                groups.splice(groups.findIndex((group) => group === "Ungrouped"), 1);
            }
            return groups;
        })();
        localStorage.setItem("allMutableGroups", JSON.stringify(groups));
        return groups;
    }
})(), fieldset = document.querySelector("fieldset"), searchButton = document.getElementById("search-button"), main = document.querySelector("main"), linkGroupInput = document.getElementById("linkGroupInput"), linkGroupSelect = document.getElementById("linkGroupSelect"), linkURL = document.getElementById("linkURL"), linkName = document.getElementById("linkName");
function prepareSearchInput() {
    const datalist = document.getElementById("find-reference_options");
    datalist.innerHTML = "";
    datalist.append(...db.reduce((allLinks, link) => {
        const option = document.createElement("option");
        option.value = link.name;
        allLinks.push(option);
        return allLinks;
    }, []));
}
function showAllGroupsInSidebar() {
    allMutableGroups.forEach((group) => {
        const newGroup = document.createElement("label");
        newGroup.innerHTML = `<input type="radio" name="group" data-group="${group}" />
    <span>${group}</span>
    <button>-</button>`;
        fieldset.append(newGroup);
    });
    document.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener("change", function (event) {
            const group = event.target.dataset.group;
            if (group) {
                showLinksToUser(group, "group");
            }
        });
    });
}
function prepareLinkGroupSelect() {
    linkGroupSelect.innerHTML = "";
    const allMeaningfulGroups = [...allMutableGroups, "Ungrouped"];
    linkGroupSelect.append(...allMeaningfulGroups.reduce((groups, group) => {
        const option = document.createElement("option");
        option.value = group;
        option.innerText = group;
        groups.push(option);
        return groups;
    }, []));
}
function showLinksToUser(group, elementToShow) {
    switch (elementToShow) {
        case "group":
            var filteredArray = getFilteredResults(group);
            break;
        default:
            var filteredArray = elementToShow;
            break;
    }
    main.innerHTML = filteredArray.reduce(function () {
        return (arguments[0] +
            `<div><input type="radio" name="link-settings"><a data-group="${arguments[1].group}" target="_blank" href="${arguments[1].url}">${arguments[1].name}</a></div>`);
    }, "");
}
function getFilteredResults(group) {
    return db.filter((item) => {
        return group === "All" ? true : item.group === group;
    });
}
function configureGroupNameInput(situation, span) {
    const groupInput = document.createElement("input");
    groupInput.placeholder = "new group";
    groupInput.type = "text";
    switch (situation) {
        case "create":
            groupInput.addEventListener("blur", function () {
                var _a, _b;
                if (!groupInput.value) {
                    (_a = groupInput.parentElement) === null || _a === void 0 ? void 0 : _a.remove();
                    return;
                }
                if (allMutableGroups.includes(groupInput.value)) {
                    alert("This groups already exists");
                    (_b = groupInput.parentElement) === null || _b === void 0 ? void 0 : _b.remove();
                    return;
                }
                groupInput.before((() => {
                    const span = document.createElement("span");
                    groupInput.previousElementSibling.dataset.group = span.innerText = groupInput.value;
                    return span;
                })());
                allMutableGroups.push(groupInput.value);
                localStorage.setItem("allMutableGroups", JSON.stringify(allMutableGroups));
                prepareLinkGroupSelect();
                groupInput.remove();
            });
            return groupInput;
        case "rename":
            groupInput.value = span === null || span === void 0 ? void 0 : span.innerText;
            span.before(groupInput);
            groupInput.focus();
            span.style.display = "none";
            groupInput.addEventListener("blur", function () {
                var _a;
                if (groupInput.value == "" ||
                    allMutableGroups.includes(groupInput.value)) {
                    alert("Field is empty or name already exists. Unsuitable name");
                    span.removeAttribute("style");
                    groupInput.remove();
                    return;
                }
                allMutableGroups[allMutableGroups.findIndex((group) => group === span.innerText)] = groupInput.value;
                db.filter((link) => link.group === span.innerText).forEach((oldLink) => {
                    oldLink.group = groupInput.value;
                });
                localStorage.setItem("allMutableGroups", JSON.stringify(allMutableGroups));
                localStorage.setItem("db", JSON.stringify(db));
                main.querySelectorAll(`a[data-group="${span.innerText}"]`).forEach((anchor) => {
                    anchor.dataset.group = groupInput.value;
                });
                span.innerText = groupInput.value;
                span.removeAttribute("style");
                ((_a = span.parentElement) === null || _a === void 0 ? void 0 : _a.firstChild).dataset.group =
                    groupInput.value;
                groupInput.remove();
                prepareLinkGroupSelect();
            });
            return;
    }
}
fieldset.addEventListener("click", function (event) {
    if (event.target.tagName === "BUTTON") {
        const action = event.target.innerText;
        switch (action) {
            case "-":
                confirm("Are you sure to remove this group? All elements will be ungrouped, but not deleted")
                    ? (() => {
                        event.target.parentElement.firstChild.checked
                            ? fieldset.querySelector("[data-group=All]").click()
                            : "";
                        db.filter((link) => link.group === event.target.previousElementSibling.innerText).forEach((link) => {
                            link.group = "Ungrouped";
                        });
                        allMutableGroups.splice(allMutableGroups.findIndex((group) => group === event.target.previousElementSibling.innerText), 1);
                        localStorage.setItem("allMutableGroups", JSON.stringify(allMutableGroups));
                        event.target.parentElement.remove();
                        localStorage.setItem("db", JSON.stringify(db));
                        prepareLinkGroupSelect();
                    })()
                    : "";
                break;
            case "+":
                const newGroup = document.createElement("label");
                newGroup.prepend((() => {
                    const radio = document.createElement("input");
                    radio.dataset.group = "";
                    radio.name = "group";
                    radio.setAttribute("type", "radio");
                    radio.addEventListener("change", function (event) {
                        const group = event.target.dataset.group;
                        if (group) {
                            showLinksToUser(group, "group");
                        }
                    });
                    return radio;
                })(), configureGroupNameInput("create", undefined), (() => {
                    const button = document.createElement("button");
                    button.innerText = "-";
                    return button;
                })());
                fieldset.append(newGroup);
                fieldset.lastChild.children[1].focus();
                break;
        }
    }
});
fieldset.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    const TARGET = event.target;
    if (TARGET.tagName !== "SPAN" ||
        TARGET.parentElement == fieldset.children[1] ||
        TARGET.parentElement == fieldset.children[2])
        return;
    configureGroupNameInput("rename", TARGET);
});
searchButton.addEventListener("click", function () {
    if (document.querySelector('input[type="search"]')
        .value === "") {
        fieldset.querySelector('input[type="radio"]').click();
        showLinksToUser(fieldset.querySelector("input:checked").dataset
            .group, "group");
        return;
    }
    const searchedLink = db.find((link) => link.name ===
        document.querySelector('input[type="search"]').value);
    if (searchedLink) {
        fieldset.querySelector('input[type="radio"]').click();
        showLinksToUser(fieldset.querySelector("input:checked").dataset
            .group, [searchedLink]);
    }
    else {
        alert("There is no link you tried to find");
    }
});
main.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    const TARGET = event.target;
    switch (TARGET.tagName) {
        case "DIV":
            TARGET.firstChild.checked = true;
            var anchor = TARGET.children[1];
            break;
        case "A":
            TARGET.previousElementSibling.checked = true;
            var anchor = TARGET;
            break;
        default:
            TARGET.checked = true;
            var anchor = TARGET.nextElementSibling;
            break;
    }
    const configuration = document.querySelector(".configure-link");
    configuration.children[0].value = anchor.innerText;
    configuration.children[1].value = anchor.href;
    linkGroupInput.value = anchor.dataset.group;
});
document
    .getElementById("addNewLinkButton")
    .addEventListener("click", function () {
    linkName.value = "";
    linkURL.value = "";
    linkGroupInput.value = "Ungrouped";
});
linkGroupInput.addEventListener("blur", function () {
    const radio = document.querySelector('input[name="link-settings"]:checked');
    if (!radio || radio.parentElement.tagName === "BODY")
        return;
    const activeAnchor = radio.nextElementSibling;
    if (![...allMutableGroups, "Ungrouped"].includes(linkGroupInput.value)) {
        linkGroupInput.value = activeAnchor.dataset.group;
        alert("This group doesn't exist");
        return;
    }
    db.find((link) => link.name === activeAnchor.innerText).group =
        linkGroupInput.value;
    activeAnchor.dataset.group = linkGroupInput.value;
    localStorage.setItem("db", JSON.stringify(db));
    showLinksToUser(fieldset.querySelector("input:checked")
        .nextElementSibling.innerText, "group");
});
linkURL.addEventListener("blur", function () {
    const radio = document.querySelector('input[name="link-settings"]:checked');
    if (!radio || radio.parentElement.tagName === "BODY")
        return;
    const activeAnchor = radio.nextElementSibling;
    if (!linkURL.value) {
        linkURL.value = activeAnchor.href;
        alert("URL should contain at least 1 character");
        return;
    }
    linkURL.value = linkURL.value.trim();
    try {
        db.find((link) => link.name === activeAnchor.innerText).url =
            linkURL.value;
    }
    catch (_a) {
        return;
    }
    activeAnchor.href = linkURL.value;
    localStorage.setItem("db", JSON.stringify(db));
});
linkName.addEventListener("blur", function () {
    const radio = document.querySelector('input[name="link-settings"]:checked');
    if (!radio || radio.parentElement.tagName === "BODY")
        return;
    const activeAnchor = radio.nextElementSibling;
    if (!linkName.value) {
        alert("Name should contain at least 1 character");
        linkName.value = activeAnchor.innerText;
        return;
    }
    else if (db.some((link) => link.name === linkName.value)) {
        alert("Link name already exists");
        linkName.value = activeAnchor.innerText;
        return;
    }
    try {
        db.find((link) => link.url === activeAnchor.href).name =
            linkName.value;
    }
    catch (_a) {
        return;
    }
    activeAnchor.innerText = linkName.value;
    prepareSearchInput();
    localStorage.setItem("db", JSON.stringify(db));
});
document
    .getElementById("special-button-for-link")
    .addEventListener("click", function () {
    const radio = document.querySelector('input[name="link-settings"]:checked');
    if (![...allMutableGroups, "Ungrouped"].includes(linkGroupInput.value) ||
        !linkName.value ||
        !linkURL.value) {
        alert("Please recheck all fields");
        return;
    }
    if (radio.parentElement.tagName === "BODY") {
        db.push({
            name: linkName.value,
            url: linkURL.value,
            group: linkGroupInput.value,
        });
        localStorage.setItem("db", JSON.stringify(db));
        prepareSearchInput();
        showLinksToUser(fieldset.querySelector("input:checked")
            .nextElementSibling.innerText, "group");
        radio.checked = false;
    }
    else {
        confirm("Are you sure about deleting this link?")
            ? (() => {
                db.splice(db.findIndex((link) => link.name === linkName.value &&
                    link.url === linkURL.value &&
                    link.group === linkGroupInput.value), 1);
                showLinksToUser(fieldset.querySelector("input:checked")
                    .nextElementSibling.innerText, "group");
                prepareSearchInput();
                radio.checked = false;
                localStorage.setItem("db", JSON.stringify(db));
            })()
            : "";
    }
});
document.querySelector("section").addEventListener("click", function (event) {
    const TARGET = event.target;
    if (TARGET.tagName === "SECTION") {
        document.querySelector('input[name="link-settings"]:checked').checked = false;
    }
});
prepareLinkGroupSelect();
showAllGroupsInSidebar();
prepareSearchInput();
showLinksToUser("All", "group");
//# sourceMappingURL=main.js.map