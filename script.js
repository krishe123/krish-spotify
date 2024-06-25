console.log("Lets write my first website JavaScript");

let songs = [];
let currfolder;
let currentsong = new Audio();

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder) {
    currfolder = folder;
    console.log(`Fetching songs from folder: ${folder}`);

    try {
        let a = await fetch(`/${folder}/`); // Adjusted for relative path
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        let fetchedSongs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                fetchedSongs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        console.log(`Fetched songs: ${fetchedSongs}`);

        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = "";
        for (const song of fetchedSongs) {
            songUL.innerHTML +=
                `<li>
                    <img class="invert" src="music.svg" alt="">
                    <div class="info">
                        <div>${song.replace(/%20/g, " ")}</div>
                        <div>Krish</div>
                    </div>
                    <div class="playnow">
                        <span>Play now</span>
                        <img class="invert play-icon" src="play-circle-02-stroke-rounded.svg" alt="">
                    </div>
                </li>`;
        }

        document.querySelectorAll(".playnow").forEach(e => {
            e.addEventListener("click", () => {
                const songName = e.previousElementSibling.firstElementChild.innerHTML.trim();
                playMusic(songName);
            });
        });

        return fetchedSongs;
    } catch (error) {
        console.error(`Error fetching songs from folder: ${folder}`, error);
    }
}

const playMusic = (track, pause = false) => {
    currentsong.src = `/${currfolder}/` + track; // Adjusted for relative path
    if (!pause) {
        currentsong.play();
        document.querySelector("#play").src = "pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    try {
        let a = await fetch(`/songs/`); // Adjusted for relative path
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let carcontainer = document.querySelector(".carcontainer");

        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) {
            const e = array[index];

            if (e.href.includes("/songs")) {
                let folder = e.href.split("/").slice(-2)[0];
                console.log(`Fetching metadata for folder: ${folder}`);
                try {
                    let metaResponse = await fetch(`/songs/${folder}/info.json`); // Adjusted for relative path
                    let metaData = await metaResponse.json();
                    console.log(`Metadata for ${folder}:`, metaData);
                    carcontainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="playspotify">
                                <svg style="padding-top: 6px; color: #000;" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141834" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpg" alt="">
                            <h2>${metaData.title}</h2>
                            <p>${metaData.discription}</p>
                        </div>`;
                } catch (metaError) {
                    console.error(`Error fetching metadata for folder: ${folder}`, metaError);
                }
            }
        }

        document.querySelectorAll(".card").forEach(e => {
            e.addEventListener("click", async item => {
                console.log(`Card clicked, fetching songs for folder: ${item.currentTarget.dataset.folder}`);
                songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
                if (songs.length > 0) {
                    playMusic(songs[0], true);
                }
            });
        });
    } catch (error) {
        console.error("Error displaying albums", error);
    }
}

async function main() {
    await displayAlbums();
    songs = await getsongs("songs/cs");
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    console.log("Songs list:", songs);

    document.querySelector('#play').addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            document.querySelector('#play').src = "pause.svg";
        } else {
            currentsong.pause();
            document.querySelector('#play').src = "play-circle-02-stroke-rounded.svg";
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percentage = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percentage + "%";
        currentsong.currentTime = ((currentsong.duration) * percentage) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.querySelector('#prev').addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    document.querySelector('#next').addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentsong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentsong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

document.addEventListener("DOMContentLoaded", main);
