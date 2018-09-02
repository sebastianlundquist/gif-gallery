/* Global variables
   ========================================================================== */

let photoDataArray = [];    //  To be filled with essential data about the images
let globalPage = 0;         //  For keeping track of which page of results has been loaded
let randomOffset = 0;       //  For displaying 'random' gifs
let imgCounter = 0;         //  Number of images loaded in the document. Used for determining when all images have finished loading.

/* Main functions
   ========================================================================== */

//  Fetches the data from the server and passes on the response
function getPhotoData(offset) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", (e) => {
            if (JSON.parse(e.target.response).meta.status === 200) {
                resolve(JSON.parse(e.target.response));
            }
            else {
                document.body.innerHTML = `<h1 style="text-align:center">Something went wrong.</h1>`;
            }
        });
        xhr.open("GET", `https://api.giphy.com/v1/gifs/trending?limit=24&offset=${offset}&api_key=XwgDk2sMFSUqwnnTZO2yKJCJ3XlWAepZ`);
        xhr.send();
    });
}

//  Displays a "loading" gif to be removed once all images have loaded
function displayLoading(obj) {
    disableScroll();
    document.getElementById("load").style.display = "block";
    return obj;
}

//  Saves the height and URL for each image to be used in other functions
function loadGifs(object) {
    for (let i = 0; i < 24; i++) {
        photoDataArray.push({"title": object.data[i].title, "height": object.data[i].images.fixed_width.height, "url": object.data[i].images.fixed_width.url});
    }
    return object;
}

//  Generates columns for the gallery and populates them with gifs
function generateColumns() {
    let minHeight;
    let cols = [];
    let colHeights = [0, 0, 0, 0];
    let colNums = [0, 0, 0, 0];
    let minCol;
    let page = document.createElement("div");
    page.setAttribute("class", "page");
    for (let i = 0; i < 4; i++) {
        cols.push(document.createElement("div"));
        cols[i].setAttribute("class", "column");
        cols[i].setAttribute("id", `col${i + 4 * globalPage}`);
        page.appendChild(cols[i]);
    }
    document.getElementById("gallery-container").appendChild(page);

    for (let i = 24 * globalPage; i < 24 * (globalPage + 1); i++) {
        minHeight = Math.min(...colHeights);
        minCol = colHeights.indexOf(minHeight);
        colHeights[minCol] += parseInt(photoDataArray[i].height);
        colNums[minCol]++;
        cols[minCol].innerHTML += `<div class="image-container"><img id="img${i}" src="${photoDataArray[i].url}" alt="${photoDataArray[i].title}" tabindex="0"></div>`;
    }
    globalPage++;
}

//  Resolves when every image in the gallery has finished loading
function checkLoadedImages() {
    return new Promise((resolve, reject) => {
        let images = document.getElementById("gallery-container").getElementsByTagName("img"),
            len = images.length;
        [].forEach.call(images, function (img) {
            img.addEventListener("load", incrementCounter, false);
        });

        function incrementCounter() {
            imgCounter++;
            if (imgCounter === len) {
                resolve();
            }
        }
    });
}

//  Hides loading screen and re-enables scroll
function removeLoading() {
    document.getElementById("load").style.display = "none";
    enableScroll();
}

/* Fullscreen functionality
   ========================================================================== */

//  Declared globally for better performance
const displayImage = document.querySelector("#display-image img");
const previousImage = document.querySelector("#previous img");
const nextImage = document.querySelector("#next img");

//  Displays and handles the fullscreen view
function openFullscreen(imageArray, index) {
    disableScroll();
    waitForImageLoad()
        .then(function() {
            displayImage.setAttribute("src", modifyURL(imageArray[index].url));
            displayImage.setAttribute("alt", imageArray[index].title);
        });

    if(index > 0) {
        previousImage.setAttribute("src", imageArray[index-1].url);
        previousImage.setAttribute("alt", "Previous GIF");
    }
    else {
        previousImage.setAttribute("src", "img/x.svg");
        previousImage.setAttribute("alt", "X icon");
    }
    if(index < imageArray.length - 1) {
        nextImage.setAttribute("src", imageArray[index+1].url);
        nextImage.setAttribute("alt", "Next GIF");
    }
    else {
        nextImage.setAttribute("src", "img/ref.svg");
        nextImage.setAttribute("alt", "Refresh icon");
    }

    document.querySelector("img[data-js=get-random-gifs]").style.display = "none";
    document.getElementById("fullscreen-container").style.display = "flex";

    function previousImageFunction() {
        if(index > 0) {
            openFullscreen(imageArray, index - 1);
        }
    }

    previousImage.onclick = function () {
        previousImageFunction();
    };

    previousImage.onkeyup = function (e) {
        if (e.key === "Enter") {
            previousImageFunction();
        }
    };

    function nextImageFunction() {
        if(index < imageArray.length - 1) {
            openFullscreen(imageArray, index + 1);
        }
        else if(index === imageArray.length - 1) {
            nextImage.setAttribute("src", "img/loading.gif");
            getPhotoData(24 * globalPage + randomOffset)
                .then(loadGifs)
                .then(generateColumns)
                .then(checkLoadedImages)
                .then(function() {
                    nextImage.setAttribute("src", imageArray[index+1].url);
                });
        }
    }

    nextImage.onclick = function () {
        nextImageFunction();
    };

    nextImage.onkeyup = function (e) {
        if (e.key === "Enter") {
            nextImageFunction();
        }
    };
}

//  Displays a placeholder loading gif until actual fullscreen gif has finished loading
function waitForImageLoad() {
    displayImage.setAttribute("src", "img/loading.gif");
    return new Promise((resolve, reject) => {
        displayImage.addEventListener("load", function() {
            resolve();
        })
    });
}

/* Scrolling functionality
   ========================================================================== */

const keys = {37: 1, 38: 1, 39: 1, 40: 1};

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

//  Prevents scrolling while in fullscreen view or while gallery is loading
function disableScroll() {
    window.onwheel = preventDefault;                                //  Modern browsers
    window.onmousewheel = document.onmousewheel = preventDefault;   //  Older browsers
    window.ontouchmove  = preventDefault;                           //  Mobile browsers
    document.onkeydown  = preventDefaultForScrollKeys;              //  Keyboard scroll keys
    document.body.style.touchAction = "none";
}

//  Resets scrolling functionality to normal
function enableScroll() {
    window.onmousewheel = document.onmousewheel = null;
    window.onwheel = null;
    window.ontouchmove = null;
    document.onkeydown = null;
    document.body.style.touchAction = "auto";
}

// Loads more gifs if the user scrolls to the bottom
function checkForNewDiv() {
    const lastDiv = document.querySelector("#gallery-container > div:last-child");
    let lastDivOffset = 0;
    if (lastDiv) {
        lastDivOffset = lastDiv.offsetTop + lastDiv.clientHeight;
    }
    let pageOffset = window.pageYOffset + window.innerHeight;

    if (pageOffset === lastDivOffset) {
        init(24 * globalPage + randomOffset);
    }
}

/* Helper functions
   ========================================================================== */

//  Creates a random offset to produce pseudo-random gifs from the trending section.
//  The random gif endpoint is not suitable for populating entire galleries, as it can only return one gif per API call,
//  resulting in long load times.
function setRandomOffset() {
    randomOffset = Math.floor(Math.random() * 4000);
}

//  Converts thumbnail image urls to high-res image urls
function modifyURL(url) {
    return url.replace("200w", "giphy");
}

/* Event listeners
   ========================================================================== */

function openFullscreenFunction(e) {
    if (e.target.id.includes("img")) {
        openFullscreen(photoDataArray, parseInt(e.target.id.slice(3, e.target.id.length)));
        if (e.key === "Enter") {
            document.getElementById("close-fullscreen").focus();
        }
    }
}

function closeFullscreenFunction() {
    enableScroll();
    document.getElementById("fullscreen-container").style.display = "none";
    document.querySelector("img[data-js=get-random-gifs]").style.display = "inline";
}

function getRandomGifs() {
    const parent = document.getElementById("gallery-container");
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
    photoDataArray = [];
    globalPage = 0;
    imgCounter = 0;
    setRandomOffset();
    init(randomOffset);
}

document.querySelector(".gallery-container[data-js=open-fullscreen]").addEventListener("click", function (e) {
    openFullscreenFunction(e);
});

document.querySelector(".gallery-container[data-js=open-fullscreen]").addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
        openFullscreenFunction(e);
    }
});

document.querySelector(".close-fullscreen span[data-js=close-fullscreen]").addEventListener("click", function (e) {
    closeFullscreenFunction();
});

document.querySelector(".close-fullscreen span[data-js=close-fullscreen]").addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
        closeFullscreenFunction();
    }
});

document.querySelector("img[data-js=get-random-gifs").addEventListener("click", function () {
    getRandomGifs();
});

document.querySelector("img[data-js=get-random-gifs").addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
        getRandomGifs();
    }
});

window.addEventListener("scroll", checkForNewDiv);

/* Initialize page
   ========================================================================== */

function init(offset) {
    getPhotoData(offset)
        .then(displayLoading)
        .then(loadGifs)
        .then(generateColumns)
        .then(checkLoadedImages)
        .then(removeLoading);
}
init(24 * globalPage);