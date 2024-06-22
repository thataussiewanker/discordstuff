let celebNames = ['BRAD PITT', 'ANGELINA JOLIE', 'TOM CRUISE', 'JENNIFER ANISTON'];
const spinButton = document.getElementById('spinButton');
const editCelebsButton = document.getElementById('editCelebsButton');
const celebEditDiv = document.getElementById('celebEditDiv');
const celebTextArea = document.getElementById('celebTextArea');
const saveCelebsButton = document.getElementById('saveCelebsButton');
const selectedCelebDiv = document.getElementById('selected-celeb');
const slotsContainer = document.getElementById('slots-container');
const mediaFeed = document.getElementById('media-feed');
const filterButton = document.getElementById('filterButton');
const mediaTypeButton = document.getElementById('mediaTypeButton');
const nextButton = document.getElementById('nextButton');
const prevButton = document.getElementById('prevButton');

let maxNameLength = Math.max(...celebNames.map(name => name.length));
let filterType = 'all';
let mediaType = 'both';
let mediaIndex = 0;
let mediaItems = [];
let after = null; // Used for pagination

editCelebsButton.addEventListener('click', () => {
    celebEditDiv.classList.toggle('hidden');
    celebTextArea.value = celebNames.join(', ');
});

saveCelebsButton.addEventListener('click', () => {
    const newCelebs = celebTextArea.value.split(',').map(name => name.trim().toUpperCase());
    if (newCelebs.length > 0) {
        celebNames = newCelebs;
        maxNameLength = Math.max(...celebNames.map(name => name.length));
        createSlots();
    }
    celebEditDiv.classList.add('hidden');
});

spinButton.addEventListener('click', () => {
    spinSlots();
});

filterButton.addEventListener('click', () => {
    if (filterType === 'all') {
        filterType = 'no-nsfw';
        filterButton.textContent = 'Filter: No NSFW Content';
    } else if (filterType === 'no-nsfw') {
        filterType = 'nsfw';
        filterButton.textContent = 'Filter: NSFW Content';
    } else {
        filterType = 'all';
        filterButton.textContent = 'Filter: All Content';
    }
    fetchMedia(selectedCelebDiv.innerText.split(': ')[1], true);
});

mediaTypeButton.addEventListener('click', () => {
    if (mediaType === 'both') {
        mediaType = 'images';
        mediaTypeButton.textContent = 'Media: Images';
    } else if (mediaType === 'images') {
        mediaType = 'videos';
        mediaTypeButton.textContent = 'Media: Videos';
    } else {
        mediaType = 'both';
        mediaTypeButton.textContent = 'Media: Both';
    }
    fetchMedia(selectedCelebDiv.innerText.split(': ')[1], true);
});

nextButton.addEventListener('click', () => {
    mediaIndex++;
    if (mediaIndex >= mediaItems.length) {
        fetchMedia(selectedCelebDiv.innerText.split(': ')[1]);
    } else {
        displayCurrentMedia();
    }
});

prevButton.addEventListener('click', () => {
    mediaIndex = (mediaIndex - 1 + mediaItems.length) % mediaItems.length;
    displayCurrentMedia();
});

function createSlots() {
    slotsContainer.innerHTML = '';
    for (let i = 0; i < maxNameLength; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.textContent = ' ';
        slotsContainer.appendChild(slot);
    }
}

function spinSlots() {
    const slots = document.querySelectorAll('.slot');
    const selectedName = celebNames[Math.floor(Math.random() * celebNames.length)];
    const nameLength = selectedName.length;
    const padding = Math.floor((maxNameLength - nameLength) / 2);

    let intervals = [];

    slots.forEach((slot, index) => {
        let delay = (index + 1) * 100;
        let interval = setInterval(() => {
            slot.textContent = getRandomLetter();
        }, 50);
        intervals.push(setTimeout(() => {
            clearInterval(interval);
            slot.textContent = (index >= padding && index < padding + nameLength) ? selectedName[index - padding] : ' ';
        }, delay + 1000));
    });

    setTimeout(() => {
        selectedCelebDiv.innerText = `The selected celebrity is: ${selectedName}`;
        fetchMedia(selectedName, true);
    }, maxNameLength * 100 + 1500);
}

function getRandomLetter() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
    return letters.charAt(Math.floor(Math.random() * letters.length));
}

function fetchMedia(celebrity, reset = false) {
    if (reset) {
        mediaItems = [];
        mediaIndex = 0;
        after = null;
    }

    let url = `https://www.reddit.com/search.json?q=${encodeURIComponent(celebrity)}&limit=100&include_over_18=on`;
    if (after) {
        url += `&after=${after}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            after = data.data.after;
            const newItems = data.data.children
                .map(child => child.data)
                .filter(post => {
                    let isValidType = false;
                    if (mediaType === 'both') {
                        isValidType = post.post_hint === 'image' || post.post_hint === 'hosted:video';
                    } else if (mediaType === 'images') {
                        isValidType = post.post_hint === 'image';
                    } else if (mediaType === 'videos') {
                        isValidType = post.post_hint === 'hosted:video';
                    }

                    if (filterType === 'no-nsfw') {
                        return isValidType && !post.over_18;
                    } else if (filterType === 'nsfw') {
                        return isValidType && post.over_18;
                    } else {
                        return isValidType;
                    }
                })
                .map(post => ({
                    url: post.post_hint === 'image' ? post.url : post.media.reddit_video.fallback_url,
                    type: post.post_hint
                }));

            mediaItems = mediaItems.concat(newItems);
            displayCurrentMedia();
        })
        .catch(error => console.error('Error fetching media:', error));
}

function displayCurrentMedia() {
    if (mediaItems.length === 0) {
        mediaFeed.innerHTML = '<p>No media found.</p>';
        return;
    }

    const item = mediaItems[mediaIndex % mediaItems.length];
    mediaFeed.innerHTML = '';
    const element = document.createElement(item.type === 'image' ? 'img' : 'video');
    element.src = item.url;
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.maxWidth = '800px';
    element.style.margin = '20px auto';
    element.style.objectFit = 'contain';
    if (item.type === 'hosted:video') {
        element.autoplay = true;
        element.controls = true;
        element.addEventListener('ended', () => {
            setTimeout(() => {
                nextButton.click();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            nextButton.click();
        }, 5000);
    }
    mediaFeed.appendChild(element);
}

createSlots();
