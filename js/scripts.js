// TODO: scroll back up on refresh

let photoDataArray = [];
let colHeights = {
    "col1": 0,
    "col2": 0,
    "col3": 0,
    "col4": 0
};
let globalPage = 0;
let imgCounter = 4;

var keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e) {
    e = e || window.event;
    if (e.preventDefault)
        e.preventDefault();
    e.returnValue = false;
}

function preventDefaultForScrollKeys(e) {
    if (keys[e.keyCode]) {
        preventDefault(e);
        return false;
    }
}

function disableScroll() {
    window.onwheel = preventDefault; // modern standard
    window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
    window.ontouchmove  = preventDefault; // mobile
    document.onkeydown  = preventDefaultForScrollKeys;
    document.body.style.touchAction = "none";
}

function enableScroll() {
    window.onmousewheel = document.onmousewheel = null;
    window.onwheel = null;
    window.ontouchmove = null;
    document.onkeydown = null;
    document.body.style.touchAction = "auto";
}

function getPhotoData(offset) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", (e) => {
            if (e.target.status === 200) {
                resolve(JSON.parse(e.target.response));
            }
            else {
                reject([404, "Server did not respond."]);
            }
        });
        xhr.open("GET", `https://api.giphy.com/v1/gifs/search?q=funny+cat&limit=24&offset=${offset}&api_key=wOnsfsLy7eQAyyMgceH6zL4JP9OEP1rn`);
        xhr.send();
    });
}

function checkLoadedImages() {
    return new Promise((resolve, reject) => {
        let images = document.images,
            len = images.length;
        [].forEach.call(images, function (img) {
            img.addEventListener('load', incrementCounter, false);
        });

        function incrementCounter() {
            imgCounter++;
            if (imgCounter === len) {
                resolve("ok");
            }
        }
    });
}

function checkForNewDiv() {
    let lastDiv = document.querySelector("#container > div:last-child");
    let lastDivOffset = lastDiv.offsetTop + lastDiv.clientHeight;
    let pageOffset = window.pageYOffset + window.innerHeight;

    if (pageOffset === lastDivOffset) {
        getPhotoData(24 * globalPage)
            .then(function(object) {disableScroll(); document.getElementById("load").style.display = "block"; return object;})
            .then(loadGifs)
            .then(generateColumns)
            .then(addEventListeners)
            .then(checkLoadedImages)
            .then(function() {document.getElementById("load").style.display = "none"; enableScroll();});
    }
}

function loadGifs(object) {
    for (let i = 0; i < 24; i++) {
        photoDataArray.push({"height": object.data[i].images.fixed_width.height, "url": object.data[i].images.fixed_width.url});
    }
    return object;
}

function generateColumns() {
    let arr;
    let min;
    let page = document.createElement("div");
    let col0 = document.createElement("div");
    let col1 = document.createElement("div");
    let col2 = document.createElement("div");
    let col3 = document.createElement("div");
    page.setAttribute("class", "page");
    page.setAttribute("id", `page${globalPage}`);
    col0.setAttribute("class", "column");
    col0.setAttribute("id", `col${4 * globalPage}`);
    col1.setAttribute("class", "column");
    col1.setAttribute("id", `col${4 * globalPage + 1}`);
    col2.setAttribute("class", "column");
    col2.setAttribute("id", `col${4 * globalPage + 2}`);
    col3.setAttribute("class", "column");
    col3.setAttribute("id", `col${4 * globalPage + 3}`);

    page.appendChild(col0);
    page.appendChild(col1);
    page.appendChild(col2);
    page.appendChild(col3);
    document.getElementById("container").appendChild(page);

    for (let i = 24 * globalPage; i < 24 * (globalPage + 1); i++) {
        arr = Object.values(colHeights);
        min = Math.min(...arr);
        if (colHeights.col1 <= colHeights.col2 && colHeights.col1 <= colHeights.col3 && colHeights.col1 <= colHeights.col4) {
            colHeights.col1 += parseInt(photoDataArray[i].height);
            col0.innerHTML += `<div id="div${i}" class="image-container"><img id="img${i}" src="${photoDataArray[i].url}"></div>`;
        }
        else if (colHeights.col2 <= colHeights.col3 && colHeights.col2 <= colHeights.col4 && colHeights.col2 <= colHeights.col1) {
            colHeights.col2 += parseInt(photoDataArray[i].height);
            col1.innerHTML += `<div id="div${i}" class="image-container"><img id="img${i}" src="${photoDataArray[i].url}"></div>`;
        }
        else if (colHeights.col3 <= colHeights.col4 && colHeights.col3 <= colHeights.col1 && colHeights.col3 <= colHeights.col2) {
            colHeights.col3 += parseInt(photoDataArray[i].height);
            col2.innerHTML += `<div id="div${i}" class="image-container"><img id="img${i}" src="${photoDataArray[i].url}"></div>`;
        }
        else if (colHeights.col4 <= colHeights.col1 && colHeights.col4 <= colHeights.col2 && colHeights.col4 <= colHeights.col3) {
            colHeights.col4 += parseInt(photoDataArray[i].height);
            col3.innerHTML += `<div id="div${i}" class="image-container"><img id="img${i}" src="${photoDataArray[i].url}"></div>`;
        }
    }
    colHeights.col1 = 0;
    colHeights.col2 = 0;
    colHeights.col3 = 0;
    colHeights.col4 = 0;
}

window.addEventListener("scroll", checkForNewDiv);

function addEventListeners() {
    for (let i = 24 * globalPage; i < 24 * (globalPage + 1); i++) {
        document.getElementById("div" + i).addEventListener("click", () => {
            openFullscreen(photoDataArray, i);
        });
    }
    globalPage += 1;
}

function openFullscreen(imageArray, index) {
    let displayImage = document.querySelector("#display-image img");
    let previousImage = document.querySelector("#previous img");
    let nextImage = document.querySelector("#next img");
    let closeButton = document.querySelector("#close span");

    disableScroll();

    displayImage.setAttribute("src", imageArray[index].url);
    imgCounter -= 3 * globalPage;
    if(index > 0) {
        previousImage.setAttribute("src", imageArray[index-1].url);
    }
    else {
        previousImage.setAttribute("src", "img/x.svg");
    }
    if(index < imageArray.length - 1) {
        nextImage.setAttribute("src", imageArray[index+1].url);
    }
    else {
        nextImage.setAttribute("src", "img/ref.svg");
    }

    document.getElementById("fullscreen-container").style.display = "flex";

    previousImage.onclick = function () {
        if(index > 0) {
            openFullscreen(imageArray, index - 1);
        }
    };

    nextImage.onclick = function () {
        if(index < imageArray.length - 1) {
            openFullscreen(imageArray, index + 1);
        }
        else if(index === imageArray.length - 1) {
            nextImage.setAttribute("src", "img/loading.gif");
            getPhotoData(24 * globalPage)
                .then(function(object) {disableScroll(); document.getElementById("load").style.display = "block"; return object;})
                .then(loadGifs)
                .then(generateColumns)
                .then(addEventListeners)
                .then(checkLoadedImages)
                .then(function() {document.getElementById("load").style.display = "none"; enableScroll();})
                .then(function() {nextImage.setAttribute("src", imageArray[index+1].url);});
        }
    };

    closeButton.onclick = function () {
        enableScroll();
        document.getElementById("fullscreen-container").style.display = "none";
    }
}

getPhotoData(24 * globalPage)
    .then(function(object) {document.getElementById("load").style.display = "block"; return object;})
    .then(loadGifs)
    .then(generateColumns)
    .then(addEventListeners)
    .then(checkLoadedImages)
    .then(function() {document.getElementById("load").style.display = "none"; window.addEventListener("scroll", checkForNewDiv);});