import firebaseConfig from "./firebaseConfig";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import Chart from "chart.js/auto";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const collectionName = "users";
const collectionBlog = "blog";

let fetchedData = [];

const viewLoggedOut = document.getElementById("logged-out-view");
const viewLoggedIn = document.getElementById("logged-in-view");

const signInWithGoogleButtonEl = document.getElementById(
  "sign-in-with-google-btn"
);

const emailInputEl = document.getElementById("email-input");
const passwordInputEl = document.getElementById("password-input");

const signInButtonEl = document.getElementById("sign-in-btn");
const createAccountButtonEl = document.getElementById("create-account-btn");

const signOutButtonEl = document.getElementById("sign-out-btn");

const userProfilePictureEl = document.getElementById("user-profile-picture");
const userGreetingEl = document.getElementById("user-greeting");

const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn");
const textareaEl = document.getElementById("post-input");
const postButtonEl = document.getElementById("post-btn");

const postsEl = document.getElementById("posts");

const createNewAccountView = document.getElementById("create-new-account-view");

const chartWrapper = document.getElementById("chart-wrapper");
const communityPage = document.getElementById("community-page");
const communityBtn = document.getElementById("community-icon-btn");
const backBtn = document.getElementById("back-icon-btn");
const posts = document.getElementById("posts");

const postButtonCommunityEl = document.getElementById("post-community-btn");
const postTextAreaEl = document.getElementById("post-community-input");

backBtn.addEventListener("click", () => showLoggedInView());

/* == UI - Event Listeners == */

postButtonCommunityEl.addEventListener("click", postCommunity);

communityBtn.addEventListener("click", communityBtnPressed);

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle);

signInButtonEl.addEventListener("click", authSignInWithEmail);
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail);

signOutButtonEl.addEventListener("click", authSignOut);

for (let moodEmojiEl of moodEmojiEls) {
  moodEmojiEl.addEventListener("click", selectMood);
}

postButtonEl.addEventListener("click", postButtonPressed);

/* === Main Code === */
let accountCreated = false;

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (accountCreated) {
      showCreatedNewAccountView();
      return;
    }
    showLoggedInView();
    showProfilePicture(userProfilePictureEl, user);
    showUserGreeting(userGreetingEl, user);
    fetchInRealtimeAndRenderPostsFromDB();
  } else {
    showLoggedOutView();
  }
});

/* = Functions - Firebase - Authentication = */

function authSignInWithGoogle() {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Signed in with Google");
    })
    .catch((error) => {
      console.error(error.message);
    });
}

function authSignInWithEmail() {
  const email = emailInputEl.value;
  const password = passwordInputEl.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      clearAuthFields();
    })
    .catch((error) => {
      console.error(error.message);
    });
}

async function authCreateAccountWithEmail() {
  const email = emailInputEl.value;
  const password = passwordInputEl.value;

  try {
    accountCreated = true;
    let userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    clearAuthFields();
  } catch (error) {
    accountCreated = false;
    console.error(error.message);
  }
}

function authSignOut() {
  signOut(auth)
    .then(() => {})
    .catch((error) => {
      console.error(error.message);
    });
}

/* == Functions - UI Functions == */
let moodState = 0;
function selectMood(event) {
  const selectedMoodEmojiElementId = event.currentTarget.id;

  changeMoodsStyleAfterSelection(selectedMoodEmojiElementId, moodEmojiEls);

  const chosenMoodValue = returnMoodValueFromElementId(
    selectedMoodEmojiElementId
  );

  moodState = chosenMoodValue;
}

function changeMoodsStyleAfterSelection(
  selectedMoodElementId,
  allMoodElements
) {
  for (let moodEmojiEl of moodEmojiEls) {
    if (selectedMoodElementId === moodEmojiEl.id) {
      moodEmojiEl.classList.remove("unselected-emoji");
      moodEmojiEl.classList.add("selected-emoji");
    } else {
      moodEmojiEl.classList.remove("selected-emoji");
      moodEmojiEl.classList.add("unselected-emoji");
    }
  }
}

function returnMoodValueFromElementId(elementId) {
  return Number(elementId.slice(5));
}

function showLoggedOutView() {
  hideView(communityPage);
  hideView(viewLoggedIn);
  showView(viewLoggedOut);
}

function showCreatedNewAccountView() {
  hideView(viewLoggedOut);
  showView(createNewAccountView);
}

function showLoggedInView() {
  hideView(communityPage);
  hideView(viewLoggedOut);
  showView(viewLoggedIn);
}

function showView(view) {
  view.style.display = "flex";
}

function hideView(view) {
  view.style.display = "none";
}

function clearInputField(field) {
  field.value = "";
}

function clearAuthFields() {
  clearInputField(emailInputEl);
  clearInputField(passwordInputEl);
}

function showProfilePicture(imgElement, user) {
  const photoURL = user.photoURL;

  if (photoURL) {
    imgElement.src = photoURL;
  } else {
    imgElement.src = "assets/images/default-profile-picture.jpeg";
  }
}

function showUserGreeting(element, user) {
  const displayName = user.displayName;

  if (displayName) {
    const userFirstName = displayName.split(" ")[0];

    element.textContent = `Hey ${userFirstName}, Welcome!`;
  } else {
    element.textContent = `Hey friend, how are you feeling?`;
  }
}

function postButtonPressed() {
  const user = auth.currentUser;

  if (moodState) {
    addPostToDB(user);
    resetAllMoodElements(moodEmojiEls);
  }
}

function resetAllMoodElements(allMoodElements) {
  for (let moodEmojiEl of allMoodElements) {
    moodEmojiEl.classList.remove("selected-emoji");
    moodEmojiEl.classList.remove("unselected-emoji");
  }

  moodState = 0;
}

async function addPostToDB(user) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      uid: user.uid,
      createdAt: serverTimestamp(),
      mood: moodState,
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error(error.message);
  }
}

function convertToMood(num) {
  let possibleMoods = ["Awful", "Bad", "Meh", "Good", "Amazing"];
  return possibleMoods[num - 1];
}

function fetchInRealtimeAndRenderPostsFromDB() {
  const user = auth.currentUser;
  onSnapshot(collection(db, collectionName), (querySnapshot) => {
    fetchedData = [];
    querySnapshot.forEach((doc) => {
      let { uid, mood, createdAt } = doc.data();
      if (user.uid === doc.data().uid) {
        fetchedData.push({
          uid: uid,
          mood: convertToMood(mood),
          date: displayDate(createdAt),
        });
        createChart(fetchedData);
      }
    });
  });
}

// "date": "2023-10-15"

function displayDate(firebaseDate) {
  if (!firebaseDate) {
    return "Date processing";
  }

  const date = firebaseDate.toDate();

  const day = date.getDate();
  const year = date.getFullYear();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[date.getMonth()];

  let hours = date.getHours();
  let minutes = date.getMinutes();
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return `${day}-${month}`;
}

let chartInstance = null;

chartInstance?.destroy();

function createChart(fetchedData) {
  document.getElementById("acquisitions").innerHTML = "";
  (async function () {
    const data = fetchedData;

    const yLabels = ["Awful", "Bad", "Meh", "Good", "Amazing"];

    // Convert "userMood" to indices in the yLabels array
    const dataPoints = data.map((row) => {
      const index = yLabels.indexOf(row.mood);
      return index !== -1 ? index : null;
    });

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(document.getElementById("acquisitions"), {
      type: "line",
      data: {
        labels: data.map((row) => row.date),
        datasets: [
          {
            label: "User Mood",
            data: dataPoints,
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value, index, values) {
                return yLabels[value];
              },
            },
          },
        },
      },
    });
  })();
}

function communityBtnPressed() {
  showCommunityPage();
  renderCommunityPosts();
}

function showCommunityPage() {
  hideView(viewLoggedOut);
  hideView(viewLoggedIn);
  showView(communityPage);
}

function postCommunity() {
  const user = auth.currentUser;

  if (postTextAreaEl.value) {
    addPostToDBC(user);
    resetAllMoodElements(moodEmojiEls);
  }
}

async function addPostToDBC(user) {
  try {
    const docRef = await addDoc(collection(db, collectionBlog), {
      uid: user.uid,
      photoURL: user.photoURL,
      content: postTextAreaEl.value,
      createdAt: serverTimestamp(),
    });
    clearInputField(postTextAreaEl);
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error(error.message);
  }
}

function renderCommunityPosts() {
  fetchInRealtimeAndRenderPostsFromDBC();
}

function fetchInRealtimeAndRenderPostsFromDBC() {
  onSnapshot(collection(db, collectionBlog), (querySnapshot) => {
    postsEl.innerHTML = " ";
    querySnapshot.forEach((doc) => {
      renderPost(postsEl, doc.data());
    });
  });
}

function renderPost(postsEl, postData) {
  postsEl.innerHTML += `
      <div class="post">
          <div class="header">
              <h3>${displayDate(postData.createdAt)}</h3>
              <img src="${postData.photoURL}">
          </div>
          <p>
              ${replaceNewlinesWithBrTags(postData.content)}
          </p>
      </div>
  `;
}

function replaceNewlinesWithBrTags(inputString) {
  return inputString.replace(/\n/g, "<br>");
}

document.getElementById("info-button").addEventListener("click", () => {
  showView(document.getElementById("info-page"));
});

document.getElementById("close").addEventListener("click", () => {
  hideView(document.getElementById("info-page"));
});
