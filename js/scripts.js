// TODO: scroll back up on refresh
// TODO: Unload all previous images on refresh to keep memory use down (and remove bugs)

let photoDataArray = [];    //  To be filled with essential data about the images
let globalPage = 0;         //  For keeping track of which page of results has been loaded
let randomOffset = 0;
let imgCounter = 0;         //  Number of images loaded in the document. Used for determining when all images have finished loading.

/*  Creates a random offset to produce pseudo-random gifs from the trending section.
    The random gif endpoint is not suitable for populating entire galleries, as it can only return one gif per API call,
    resulting in long load times. */
function setRandomOffset() {
    randomOffset = Math.floor(Math.random() * 4000);
}

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

//  Converts thumbnail image urls to high-res image urls
function modifyURL(url) {
    return url.replace("200w", "giphy");
}

//  Saves the height and URL for each image to be used in other functions
function loadGifs(object) {
    for (let i = 0; i < 24; i++) {
        photoDataArray.push({"height": object.data[i].images.fixed_width.height, "url": object.data[i].images.fixed_width.url});
    }
    return object;
}

function generateColumns() {
    let minHeight;
    let page = document.createElement("div");
    let cols = [];
    let colHeights = [0, 0, 0, 0];
    let minCol;
    page.setAttribute("class", "page");
    for (let i = 0; i < 4; i++) {
        cols.push(document.createElement("div"));
        cols[i].setAttribute("class", "column");
        page.appendChild(cols[i]);
    }
    document.getElementById("container").appendChild(page);

    for (let i = 24 * globalPage; i < 24 * (globalPage + 1); i++) {
        minHeight = Math.min(...colHeights);
        minCol = colHeights.indexOf(minHeight);
        colHeights[minCol] += parseInt(photoDataArray[i].height);
        cols[minCol].innerHTML += `<div class="image-container"><img id="img${i}" src="${photoDataArray[i].url}"></div>`;
    }
    colHeights = [0, 0, 0, 0];
    globalPage++;
}

function checkLoadedImages() {
    return new Promise((resolve, reject) => {
        let images = document.getElementById("container").getElementsByTagName("img"),
            len = images.length;
        [].forEach.call(images, function (img) {
            img.addEventListener('load', incrementCounter, false);
        });

        function incrementCounter() {
            imgCounter++;
            //console.log(`len ${len}, imgCounter ${imgCounter}`);
            if (imgCounter > len) {
                imgCounter = len;
            }
            if (imgCounter === len) {
                resolve();
            }
        }
    });
}

function waitForImageLoad() {
    let image = document.querySelector("#display-image img");
    image.setAttribute("src", "img/loading.gif");
    return new Promise((resolve, reject) => {
        image.addEventListener("load", function() {
            resolve();
        })
    });
}

function removeLoading() {
    document.getElementById("load").style.display = "none";
    enableScroll();
}

function checkForNewDiv() {
    let lastDiv = document.querySelector("#container > div:last-child");
    let lastDivOffset = 0;
    if (lastDiv) {
        lastDivOffset = lastDiv.offsetTop + lastDiv.clientHeight;
    }
    let pageOffset = window.pageYOffset + window.innerHeight;

    if (pageOffset === lastDivOffset) {
        init(24 * globalPage + randomOffset);
    }
}

function openFullscreen(imageArray, index) {
    let displayImage = document.querySelector("#display-image img");
    let previousImage = document.querySelector("#previous img");
    let nextImage = document.querySelector("#next img");

    disableScroll();

    waitForImageLoad()
        .then(function() {
            displayImage.setAttribute("src", modifyURL(imageArray[index].url));
        });

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

    document.querySelector("img[data-js=get-random-gifs]").style.display = "none";
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
            getPhotoData(24 * globalPage + randomOffset)
                .then(loadGifs)
                .then(generateColumns)
                .then(checkLoadedImages)
                .then(function() {
                    nextImage.setAttribute("src", imageArray[index+1].url);
                });
        }
    };
}

/* Prevent scrolling helper functions
   ========================================================================== */
let keys = {37: 1, 38: 1, 39: 1, 40: 1};

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

/* Event listeners
   ========================================================================== */
window.addEventListener("scroll", checkForNewDiv);

document.getElementById("container").addEventListener("click", (e) => {
    openFullscreen(photoDataArray, parseInt(e.target.id.slice(3, e.target.id.length)));
});

document.querySelector(".close[data-js=close").onclick = function () {
    enableScroll();
    document.getElementById("fullscreen-container").style.display = "none";
    document.querySelector("img[data-js=get-random-gifs]").style.display = "inline";
};

document.querySelector("img[data-js=get-random-gifs").onclick = function () {
    let parent = document.getElementById("container");
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
    imgCounter = 0;
    setRandomOffset();
    init(randomOffset);
};

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