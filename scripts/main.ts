(() => {
  (document.getElementById("dark-theme") as HTMLInputElement).checked =
    JSON.parse(localStorage.getItem("dark-theme") || "false");
})();
const db: Database = (function () {
    try {
      let neededDB = JSON.parse(localStorage.db);
      return neededDB;
    } catch {
      if (localStorage) {
      } else {
        alert(
          "The internet connection is worthless or your browser is too old. Update it or use a different one."
        );
      }
      return [];
    }
  })(),
  allMutableGroups: string[] = (function () {
    try {
      let neededGroups: Array<string> = JSON.parse(
        localStorage.getItem("allMutableGroups") as string
      );
      if (neededGroups.length == 0) {
        throw new Error("groups are empty");
      }
      return neededGroups;
    } catch {
      const groups = (() => {
        const groups = Array.from(
          new Set(
            db.reduce((allGroups: string[], link) => {
              allGroups.push(link.group);
              return allGroups;
            }, [])
          )
        );
        if (groups.includes("Ungrouped")) {
          groups.splice(
            groups.findIndex((group: string) => group === "Ungrouped"),
            1
          );
        }
        return groups;
      })();
      localStorage.setItem("allMutableGroups", JSON.stringify(groups));
      return groups;
    }
  })(),
  fieldset = document.querySelector("fieldset") as HTMLElement,
  searchButton = document.getElementById("search-button") as HTMLElement,
  main = document.querySelector("main") as HTMLElement,
  linkGroupInput = document.getElementById(
    "linkGroupInput"
  ) as HTMLInputElement,
  linkGroupSelect = document.getElementById(
    "linkGroupSelect"
  ) as HTMLDataListElement,
  linkURL = document.getElementById("linkURL") as HTMLTextAreaElement,
  linkName = document.getElementById("linkName") as HTMLInputElement;
var editableLinkInfo: Link | null = null,
  checkedLinkRadio: HTMLInputElement | null = null;
interface Link {
  name: string;
  url: string;
  group: string;
}
type Database = Array<Link>;

function prepareSearchInput() {
  const datalist = document.getElementById(
    "find-reference_options"
  ) as HTMLDataListElement;
  datalist.innerHTML = "";
  datalist.append(
    ...db.reduce((allLinks: Array<HTMLOptionElement>, link) => {
      const option = document.createElement("option");
      option.value = link.name;
      allLinks.push(option);
      return allLinks;
    }, [])
  );
}

function showAllGroupsInSidebar() {
  allMutableGroups.forEach((group) => {
    const newGroup = document.createElement("label");
    newGroup.innerHTML = /*html*/ `<input type="radio" name="group" data-group="${group}" />
    <span>${group}</span>
    <button>-</button>`;
    fieldset.append(newGroup);
  });
  document.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", function (event) {
      const group = (event.target as HTMLElement).dataset.group;
      if (group) {
        showLinksToUser(group, "group");
      }
    });
  });
}

function prepareLinkGroupSelect() {
  linkGroupSelect.innerHTML = "";
  const allMeaningfulGroups = [...allMutableGroups, "Ungrouped"];
  linkGroupSelect.append(
    ...allMeaningfulGroups.reduce(
      (groups: HTMLOptionElement[], group: string) => {
        const option = document.createElement("option");
        option.value = group;
        option.innerText = group;
        groups.push(option);
        return groups;
      },
      []
    )
  );
}

function showLinksToUser(group: string, elementToShow: "group" | Database) {
  //! показує відфільтровані за групою АБО фільтром результати в html
  editableLinkInfo = null;
  var filteredArray =
    elementToShow === "group" ? getFilteredResults(group) : elementToShow;
  main.innerHTML = filteredArray.reduce(function (): string {
    return (
      arguments[0] +
      /*html*/ `<div><input id="radio${arguments[2]}" type="radio" name="link-settings"><a data-group="${arguments[1].group}" target="_blank" href="${arguments[1].url}">${arguments[1].name}</a><label for="radio${arguments[2]}">⋮</label></div>`
    );
  }, "");
}

function getFilteredResults(group: string) {
  //! відфільтровує результати за групою
  return db.filter((item) => {
    return group === "All" ? true : item.group === group;
  }) as Database;
}

function configureGroupNameInput(
  situation: "rename",
  target: HTMLSpanElement
): void;
function configureGroupNameInput(
  situation: "create",
  target: undefined
): HTMLInputElement;
function configureGroupNameInput(
  situation: "create" | "rename",
  span: HTMLSpanElement | undefined
) {
  const groupInput = document.createElement("input");
  groupInput.placeholder = "new group";
  groupInput.type = "text";
  switch (situation) {
    case "create":
      groupInput.addEventListener("blur", function (): void {
        if (!groupInput.value) {
          groupInput.parentElement?.remove();
          return;
        }
        if (
          [...allMutableGroups, "Ungrouped", "All"].includes(groupInput.value)
        ) {
          alert("This groups already exists");
          groupInput.parentElement?.remove();
          return;
        }
        groupInput.before(
          (() => {
            const span = document.createElement("span");
            (
              groupInput.previousElementSibling as HTMLSpanElement
            ).dataset.group = span.innerText = groupInput.value;
            return span;
          })()
        );
        allMutableGroups.push(groupInput.value);
        localStorage.setItem(
          "allMutableGroups",
          JSON.stringify(allMutableGroups)
        );
        prepareLinkGroupSelect();
        groupInput.remove();
      });
      return groupInput;
    case "rename":
      groupInput.value = span?.innerText as string;
      span!.before(groupInput);
      groupInput.focus();
      span!.style.display = "none";
      groupInput.addEventListener("blur", function (): void {
        if (
          groupInput.value == "" ||
          [...allMutableGroups, "Ungrouped", "All"].includes(groupInput.value)
        ) {
          alert("Field is empty or name already exists. Unsuitable name");
          (span as HTMLSpanElement).removeAttribute("style");
          groupInput.remove();
          return;
        }
        allMutableGroups[
          allMutableGroups.findIndex((group) => group === span!.innerText)
        ] = groupInput.value;
        db.filter((link) => link.group === span!.innerText).forEach(
          (oldLink) => {
            oldLink.group = groupInput.value;
          }
        );
        localStorage.setItem(
          "allMutableGroups",
          JSON.stringify(allMutableGroups)
        );
        localStorage.setItem("db", JSON.stringify(db));
        main
          .querySelectorAll<HTMLAnchorElement>(
            `a[data-group="${span!.innerText}"]`
          )
          .forEach((anchor) => {
            anchor.dataset.group = groupInput.value;
          });
        span!.innerText = groupInput.value;
        span!.removeAttribute("style");
        (span!.parentElement?.firstChild as HTMLInputElement).dataset.group =
          groupInput.value;

        groupInput.remove();
        prepareLinkGroupSelect();
      });
      return;
  }
}

function areLinkFieldsNotValid() {
  const isLinkNameNotValid =
      !linkName.value ||
      ((editableLinkInfo
        ? !(linkName.value === editableLinkInfo!.name)
        : true) &&
        db.some((link) => link.name === linkName.value)),
    isLinkURLNotValid = !linkURL.value || !/https?:\/\//g.test(linkURL.value),
    isLinkGroupNotValid =
      !linkGroupInput.value ||
      ![...allMutableGroups, "Ungrouped"].includes(linkGroupInput.value);

  return isLinkNameNotValid || isLinkURLNotValid || isLinkGroupNotValid;
}
fieldset.addEventListener("click", function (event: any): any {
  if (event.target.tagName === "BUTTON") {
    const action = event.target.innerText;
    switch (action) {
      case "-":
        confirm(
          "Are you sure to remove this group? All elements will be ungrouped, but not deleted"
        )
          ? (() => {
              event.target.parentElement.firstChild.checked
                ? (
                    fieldset.querySelector(
                      "[data-group=All]"
                    ) as HTMLInputElement
                  ).click()
                : "";

              db.filter(
                (link) =>
                  link.group === event.target.previousElementSibling.innerText
              ).forEach((link) => {
                link.group = "Ungrouped";
              });
              allMutableGroups.splice(
                allMutableGroups.findIndex(
                  (group) =>
                    group === event.target.previousElementSibling.innerText
                ),
                1
              );
              localStorage.setItem(
                "allMutableGroups",
                JSON.stringify(allMutableGroups)
              );
              event.target.parentElement.remove();
              localStorage.setItem("db", JSON.stringify(db));
              prepareLinkGroupSelect();
            })()
          : "";
        break;
      case "+":
        const newGroup = document.createElement("label");
        newGroup.prepend(
          (() => {
            const radio = document.createElement("input");
            radio.dataset.group = "";
            radio.name = "group";
            radio.setAttribute("type", "radio");
            radio.addEventListener("change", function (event) {
              const group = (event.target as HTMLElement).dataset.group;
              if (group) {
                showLinksToUser(group, "group");
              }
            });
            return radio;
          })(),
          configureGroupNameInput("create", undefined),
          (() => {
            const button = document.createElement("button");
            button.innerText = "-";
            return button;
          })()
        );
        fieldset.append(newGroup);
        (
          (fieldset.lastChild as HTMLElement).children[1] as HTMLElement
        ).focus();

        break;
    }
  }
});
fieldset.addEventListener("contextmenu", function (event: MouseEvent): void {
  event.preventDefault();
  const TARGET = event.target as HTMLSpanElement;
  if (
    TARGET.tagName !== "SPAN" ||
    TARGET.parentElement == fieldset.children[1] ||
    TARGET.parentElement == fieldset.children[2]
  )
    return;
  configureGroupNameInput("rename", TARGET);
});
searchButton.addEventListener("click", function () {
  if (
    (document.querySelector('input[type="search"]') as HTMLInputElement)
      .value === ""
  ) {
    (fieldset.querySelector('input[type="radio"]') as HTMLInputElement).click();
    showLinksToUser(
      (fieldset.querySelector("input:checked") as HTMLInputElement).dataset
        .group as string,
      "group"
    );
    return;
  }
  const searchedLink = db.find(
    (link) =>
      link.name ===
      (document.querySelector('input[type="search"]') as HTMLInputElement).value
  );
  if (searchedLink) {
    (fieldset.querySelector('input[type="radio"]') as HTMLInputElement).click();
    showLinksToUser(
      (fieldset.querySelector("input:checked") as HTMLInputElement).dataset
        .group as string,
      [searchedLink] as Database
    );
  } else {
    alert("There is no link you tried to find");
  }
});
main.addEventListener("click", function (event) {
  if ((event.target as HTMLElement).tagName !== "INPUT") return;
  checkedLinkRadio = event.target as HTMLInputElement;
  editableLinkInfo = {
    ...db.find(
      (link) =>
        link.name ===
        (
          (event.target as HTMLInputElement)
            .nextElementSibling as HTMLAnchorElement
        ).innerText
    ),
  } as Link;
  const configuration = document.querySelector(
    ".configure-link"
  ) as HTMLDivElement;
  (configuration.children[0] as HTMLInputElement).value = editableLinkInfo.name;
  (configuration.children[1] as HTMLInputElement).value = editableLinkInfo.url;
  linkGroupInput.value = editableLinkInfo.group;
});

document
  .getElementById("addNewLinkButton")!
  .addEventListener("click", function () {
    linkName.value = "";
    linkURL.value = "";
    linkGroupInput.value = "Ungrouped";
    checkedLinkRadio = document.getElementById(
      "createLinkState"
    ) as HTMLInputElement;
  });

linkGroupInput.addEventListener("blur", function () {
  if (!editableLinkInfo) return;
  if (![...allMutableGroups, "Ungrouped"].includes(linkGroupInput.value)) {
    linkGroupInput.value = editableLinkInfo.group;
    alert("This group doesn't exist");
    return;
  }
});
linkURL.addEventListener("blur", function () {
  if (!editableLinkInfo) return;
  if (!linkURL.value || !/https?:\/\//g.test(linkURL.value)) {
    linkURL.value = editableLinkInfo!.url;
    alert("URL should start from http");
    return;
  }
  linkURL.value = linkURL.value.trim();
  localStorage.setItem("db", JSON.stringify(db));
});
linkName.addEventListener("blur", function () {
  if (!editableLinkInfo) return;
  if (!linkName.value) {
    alert("Name should contain at least 1 character");
    linkName.value = editableLinkInfo.name;
    return;
  } else if (
    !(editableLinkInfo.name === linkName.value) &&
    db.some((link) => link.name === linkName.value)
  ) {
    alert("Link name already exists");
    linkName.value = editableLinkInfo.name;
    return;
  }
});

document
  .getElementById("delete-link-button")!
  .addEventListener("click", function () {
    if (!areLinkFieldsNotValid()) {
      confirm("Are you sure about deleting this link?")
        ? (() => {
            db.splice(
              db.findIndex(
                (link) =>
                  link.name === linkName.value &&
                  link.url === linkURL.value &&
                  link.group === linkGroupInput.value
              ),
              1
            );
            checkedLinkRadio!.checked = false;
            checkedLinkRadio = null;
            editableLinkInfo = null;
            showLinksToUser(
              (
                fieldset.querySelector<HTMLInputElement>("input:checked")!
                  .nextElementSibling as HTMLSpanElement
              ).innerText,
              "group"
            );
            prepareSearchInput();
            localStorage.setItem("db", JSON.stringify(db));
          })()
        : "";
    }
  });
document.getElementById("edit-link-button")!.addEventListener("click", () => {
  new Promise((resolve, reject) => {
    if (areLinkFieldsNotValid()) {
      reject("");
    }
    if (editableLinkInfo) {
      const thisLinkInDb = db.find(
        (link) => link.name === editableLinkInfo!.name
      ) as Link;
      thisLinkInDb.name = linkName.value;
      thisLinkInDb.url = linkURL.value;
      thisLinkInDb.group = linkGroupInput.value;
      editableLinkInfo = null;
    } else
      db.push({
        name: linkName.value,
        url: linkURL.value,
        group: linkGroupInput.value,
      });

    resolve("");
  }).then(
    () => {
      localStorage.setItem("db", JSON.stringify(db));
      prepareSearchInput();
      checkedLinkRadio!.checked = false;
      checkedLinkRadio = null;
      showLinksToUser(
        (
          fieldset.querySelector<HTMLInputElement>("input:checked")!
            .nextElementSibling as HTMLSpanElement
        ).innerText,
        "group"
      );
    },
    () => {
      alert("Invalid link name, URL or group");
    }
  );
});
document.getElementById("dark-theme")!.addEventListener("click", function () {
  localStorage.setItem("dark-theme", `${(this as HTMLInputElement).checked}`);
});
document.querySelector("section")!.addEventListener("click", function (event) {
  if (this !== event.target) return;
  if (editableLinkInfo) {
    linkName.value = editableLinkInfo.name;
    linkURL.value = editableLinkInfo.url;
    linkGroupInput.value = editableLinkInfo.group;
    editableLinkInfo = null;
  }
  checkedLinkRadio!.checked = false;
});

prepareLinkGroupSelect();
showAllGroupsInSidebar();
prepareSearchInput();
showLinksToUser("All", "group");
