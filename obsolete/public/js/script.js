
// --- Global ---
let musicList = {};
let renderBuff = [];
let currentGenre = 'All';
let currentIdPopup = 1;


// --- SAP initialization ---
function initSAP(json) {
	for (let i in json) {
		json[i].upvoted = '';
	}
	musicList = json;
	updateRenderBuff(objToArr(musicList));
	renderMusic();
	setStaticEventListener();
}

const callGetMusicJson = (url) => {
	return fetch(url)
	.then( response => {
		if(response.ok) {
			return response.json();
		}
		return Promise.reject('error-response-not-okay');
	})
	.catch((error) => {
		if (error.toString().startsWith('error-')) {
			return Promise.reject(error);
		}
		return Promise.reject('error-response-json-bad');
	});
};

const createInitUrl = () => {
	return '/getMusic';
}

const performGetRequest = () => {
	const url = createInitUrl();
	callGetMusicJson(url)
	.then(fromJson => {
		initSAP(fromJson);
	})
	.catch( error => {
		console.log(error);
	});
};


// --- Listener setting ---
const elements = {
	// Music render
	music: document.querySelector('.music'),
	// Filter control
	menuBtn: document.querySelector('.menu-btn'),
	nav: document.querySelector('nav'),
	filterItems: document.querySelectorAll('.filter a'),
	genreTip: document.querySelector('.genre-tip'),
	// Popup control
	popupContainer: document.querySelector('.popup-container'),
	popupMask: document.querySelector('.popup-mask'),
	popupCloseBtn: document.querySelector('.popup .close-btn'),
	// Popup fields
	inputTitle: document.querySelector('#title'),
	inputArtist: document.querySelector('#artist'),
	inputAlbum: document.querySelector('#album'),
	selectGenre: document.querySelector('#genre'),
	optionsGenre: document.querySelector('#genre').options,
	// Popup actions
	saveBtn: document.querySelector('.save'),
	deleteBtn: document.querySelector('.delete'),
	// Search bar
	searchBar: document.querySelector('.search-bar'),
	searchBtn: document.querySelector('.search-btn'),
	// Tool bar
	rightBtn: document.querySelector('.right-btn'),
	invertBtn: document.querySelector('.invert-btn')
};

function setStaticEventListener() {
	// Menu control
	elements.menuBtn.addEventListener('click', toggleMenu);
	elements.nav.addEventListener('click', toggleMenu);
	// Filter anchor control
	for (let item of elements.filterItems) {
		item.addEventListener('click', filterHandler);
	}
	// Search control
	// elements.searchBar.addEventListener();
	elements.searchBtn.addEventListener('click', searchHandler);
	elements.searchBar.addEventListener('keydown', searchEnterHandler);
	// Popup control
	elements.popupMask.addEventListener('click', togglePopup);
	elements.popupCloseBtn.addEventListener('click', togglePopup);
	// Tool-bar actions
	elements.rightBtn.addEventListener('click', sortHandler);
	elements.invertBtn.addEventListener('click', sortHandler);
}

function setItemEventListener() {
	let upvotes = document.querySelectorAll('.upvote');
	let edits = document.querySelectorAll('.edit');
	// Add liseners to action module
	for (let upvote of upvotes) {
		upvote.addEventListener('click', upvoteHandler);
	}
	for (let edit of edits) {
		edit.addEventListener('click', editHandler);
	}
}

function setPopupEventListener() {		// id is music id
	elements.saveBtn.addEventListener('click', saveHandler);
	elements.deleteBtn.addEventListener('click', deleteHandler);
}

function resetPopupEventListener() {
	elements.saveBtn.removeEventListener('click', saveHandler);
	elements.deleteBtn.removeEventListener('click', deleteHandler);
}


// --- UI control ---
function toggleMenu() {
	elements.menuBtn.classList.toggle('btn-change');
	elements.nav.classList.toggle('nav-change');
	filter.classList.toggle('filter-change');
	// document.body.classList.toggle('scroll-prevent');
}

function switchGenre(anchor) {
	if (anchor.innerHTML === 'All') {
		elements.genreTip.innerHTML = 'Genre';
	}
	else {
		elements.genreTip.innerHTML = event.target.innerHTML;
	}
}

function toggleUpvote(upvote) {
	upvote.classList.toggle('upvoted');
}

function togglePopup() {
	elements.popupContainer.classList.toggle('popup-container-change');
}

function toggleRightBtn() {
	resetSortBtn();
	elements.rightBtn.classList.toggle('right-btn-change');
}

function toggleInvertBtn() {
	resetSortBtn();
	elements.invertBtn.classList.toggle('invert-btn-change');
}

function resetSortBtn() {
	elements.rightBtn.classList.remove('right-btn-change');
	elements.invertBtn.classList.remove('invert-btn-change');
}

function clearPopupInput() {
	elements.inputTitle.value = null;
	elements.inputArtist.value = null;
	elements.inputAlbum.value = null;
}

function clearSearchBar() {
	elements.searchBar.value = null;
}


// --- Event Listener Handler definitions ---
function filterHandler(event) {
	const anchor = event.target;
	currentGenre = anchor.innerHTML;
	updateRenderBuff(getGenre(currentGenre));
	renderMusic();
	switchGenre(anchor);
	resetSortBtn();
	clearSearchBar();
}

function upvoteHandler(event) {
	const id = event.target.getAttribute('data-id');
	upvoteMusicFromBuff(upvoteMusic(id));
	toggleUpvote(event.target);
	renderMusic();
}

function editHandler(event) {
	// Refresh popup
	const id = event.target.getAttribute('data-id');
	currentIdPopup = id;
	renderPopup();
	togglePopup();
	// Reset save and delete listeners
	resetPopupEventListener();
	// Add new save and delete listeners
	setPopupEventListener();
	clearPopupInput();
}

function sortHandler(event) {
	if (event.target.classList.contains('right-btn')) {
		updateRenderBuff(sort(getGenre(currentGenre), true));
		toggleRightBtn();
	}
	else {
		updateRenderBuff(sort(getGenre(currentGenre), false));
		toggleInvertBtn();
	}

	renderMusic();
}

function saveHandler() {
	saveMusicFromBuff(saveMusic(currentIdPopup));
	renderMusic();
	togglePopup();
}

function deleteHandler() {
	deleteMusic(currentIdPopup);
	deleteMusicFromBuff(currentIdPopup);
	renderMusic();
	togglePopup();
}

function searchHandler() {
	updateRenderBuff(search(elements.searchBar.value));
	renderMusic();
	elements.searchBar.blur();
	// clearSearchBar();
}

function searchEnterHandler(event) {
	if (event.keyCode === 13) {
		searchHandler();
	}
}


// --- Render definition ---
function renderMusic() {  // items is an arr
	let result = '';

	if (renderBuff.length === 0) {
		result = setPlaceholder();
	}

	for (let item of renderBuff) {
		result += `<div class="item">
			<img src="${item.image}" alt="${item.album}" />
			<div class="actions">
				<div class="upvote-module">
					<div class="upvote ${item.upvoted}" data-id="${item.id}"></div>
					<span class="upvote-tip">${item.upvotes} likes</span>
				</div>
				<div class="edit" data-id="${item.id}"></div>
			</div>
			<div class="title">${item.title}</div>
			<div class="artist">${item.artist}</div>
		</div>`;
	}
	elements.music.innerHTML = result;
	setItemEventListener();
}

function renderPopup() { 
	const item = musicList[currentIdPopup];
	elements.inputTitle.setAttribute('placeholder', item.title);
	elements.inputArtist.setAttribute('placeholder', item.artist);
	elements.inputAlbum.setAttribute('placeholder', item.album);
	for (let i in elements.optionsGenre) {
		if (elements.optionsGenre[i].value === item.genre) {
			elements.optionsGenre[i].selected = true;
		}
	}
}

function setPlaceholder() {
	const searchValue = elements.searchBar.value;

	if (searchValue !== '') {
		return `<div class="placeholder">No music/artist/album matches <i class="result-hightlight">${searchValue}</i> in <span class="result-hightlight">${currentGenre}</span>.</div>`;
	}
	else {
		return `<div class="placeholder">No music in <span class="result-hightlight">${currentGenre}</span> for now. Find bigger music world in other genres.</div>`;
	}
}


// --- Render buffer manipulations ---
function updateRenderBuff(items) {  // items is an array
	renderBuff = items;
}

function saveMusicFromBuff(music) {
	const index = getIndexInBuff(music.id);
	renderBuff[index] = music;
}

function deleteMusicFromBuff(musicID) {
	const index = getIndexInBuff(musicID);
	renderBuff.splice(index, 1);
}

function upvoteMusicFromBuff(music) {
	let index = getIndexInBuff(music.id);
	renderBuff[index] = music;
}


// --- Functions ---
function objToArr(obj) {
	let arr = [];
	for (let i in obj) {
		arr.push(obj[i]);
	}
	return arr;
}

function getIndexInBuff(id) {
	for (let i in renderBuff) {
		if (renderBuff[i].id == id) {
			return i;
		}
	}

	return -1;
}

function getGenre(genre){
	let result = [];
	if (genre === 'All') {
		result = objToArr(musicList);
	}
	else {
		for (let music of objToArr(musicList)) {
			if (music.genre.replace(/\&/g, '&amp;') === genre) {
				result.push(music);
			}
		}
	}
	return result;
}

function search(input){
	let result = [];
    input = changeFormat(input);
    for (let music of getGenre(currentGenre)) {
		if (music.album.toUpperCase().match(input) || music.artist.toUpperCase().match(input) || music.title.toUpperCase().match(input) ) {
            result.push(music);
		}
	}
	return result;
}

function changeFormat(input){
    let res = "";
    for(let i = 0; i < input.length;i++){
        if(input[i] !== " "){
            res += input[i];
        }
        else{i++;}
    }
    return res.toUpperCase();
}

//   ture: lowTohigh;  false: highToLow;
function sort(music, TOrF){
    if(TOrF === false){
        return objToArr(lowTohigh(music));}
    else{
        return objToArr(lowTohigh(music)).reverse();}
}

function lowTohigh(music){
    for(let i = 0; i < music.length; i++){
        for(let j = i+1; j < music.length; j++){
        if(music[i].upvotes > music[j].upvotes) {
            let temp = music[i];
            music[i] = music[j];
            music[j] = temp;
            }
        }
    }
        return music;
}

// Edit music infomation
function saveMusic(musicID) {
    for (let i in musicList) {
        if (i == musicID) {
        	if (elements.inputTitle.value) {
           		musicList[i].title = elements.inputTitle.value;
        	}
        	if (elements.inputArtist.value) {
            	musicList[i].artist = elements.inputArtist.value;
       		}
       		if (elements.inputAlbum.value) {
            	musicList[i].album = elements.inputAlbum.value;
       		}
       		musicList[i].genre = elements.optionsGenre[elements.selectGenre.selectedIndex].value;
       		postSaveData(musicList[i]);

   			return musicList[i];
        }
    }
}

function postSaveData(music) {
    let data = {
    	id: music.id,
        title : music.title,
        artist : music.artist,
        album : music.album,
        genre : music.genre
    };

    fetch('/getSaveData', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({'Content-Type': 'application/json'})
    })
    .then(response => response.ok ? response.json() : Promise.reject(response.status))
    // TEST ONLY
    .then(print => console.log(print))
    .catch(error => console.log('Error:'));
}

function deleteMusic(musicID) {
	postDeleteData(musicID);
	delete musicList[musicID];
}

function postDeleteData(musicID) {
    let data = {id : musicID};

    fetch('/getDeleteData', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({'Content-Type': 'application/json'})
    })
    .then(response => response.ok ? response.json() : Promise.reject(response.status))
    // TEST ONLY
    //.then(print => console.log(print))
    .catch(error => console.log('Error:'));
}

function upvoteMusic(musicID) {
    for (let i in musicList) {
        if (i === musicID) {
            if (musicList[i].upvoted === '') {
                musicList[i].upvotes += 1;
                postLikes(musicID, true);
                musicList[i].upvoted = 'upvoted';
            } else if (musicList[i].upvoted === 'upvoted') {
                musicList[i].upvotes -= 1;
                postLikes(musicID, false);
                musicList[i].upvoted = '';
            }

            return musicList[musicID];
        }
    }
}

function postLikes(musicID, flag) {
    let data = { id : musicID , isliked : flag };

    fetch('/getVotes', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({'Content-Type': 'application/json'})
    })
    .then(response => response.ok ? response.json() : Promise.reject(response.status))
    // TEST ONLY
    // .then(print => console.log(print))
    .catch(error => console.log('Error:'));
}

performGetRequest();