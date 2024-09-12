//hamburger menu
const show = document.querySelector(".btnshow");
const hide = document.querySelector(".btnhide");
const menu = document.querySelector(".menu");

hide.addEventListener("click", () => {
  menu.classList.add("hide");
  menu.classList.remove("show");
});

show.addEventListener("click", () => {
  menu.classList.add("show");
  menu.classList.remove("hide");
});
// --------------------------------------------------------
//joinclass
const modal = document.getElementById('modal');
const openModalButton = document.getElementById('openModal');
const closeModalButton = document.getElementById('closeModal');
const submitFormButton = document.getElementById('submitForm');

// Function to open the modal
const openModal = () => {
    modal.classList.remove('hidden');
};

// Function to close the modal
const closeModal = () => {
    modal.classList.add('hidden');
};

// Event listeners
openModalButton.addEventListener('click',()=> openModal());
closeModalButton.addEventListener('click',()=> closeModal());
submitFormButton.addEventListener('click', () => {
    // Handle form submission logic here
    closeModal();
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});
// ----------------------------------------------

//profile-button
      // JavaScript to toggle dialog visibility
      const profileButton = document.getElementById('profile-button');
      const profileDialog = document.getElementById('profile-dialog');
    
      profileButton.addEventListener('click', () => {
        profileDialog.classList.toggle('hidden');
  });

//-------------------------------------------------
//code

