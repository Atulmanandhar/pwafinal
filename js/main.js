// enable offline data
firebase
  .firestore()
  .enablePersistence()
  .catch((err) => {
    console.log(err);
  });

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/serviceWorker.js", { scope: "/" })
      .then((registration) => {
        console.log("registered success", registration);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log("not available");
  }
}

registerSW();
const channel = new BroadcastChannel("notificationChannel");

const FOOD_DATA_COLLECTION = "FoodData";
const CART_DATA_COLLECTION = "CartData";

const menuData = [];

const bodyWrapperEl = document.getElementById("body-wrapper");

//Modal Btns
const openModalBtn = document.getElementById("openModalBtn");
const itemDetailsModalEl = document.getElementById("myModal");
// const closeModalBtn = document.getElementsByClassName("close")[0];

// Swiper Menu
const menuCardsContainerEl = document.getElementById("menuCards-container");
const menuCardsContainerDealEl = document.getElementById(
  "menuCards-container-deal"
);
const largeCardContainer1 = document.getElementById("largeCardContainer-1");
const largeCardContainer2 = document.getElementById("largeCardContainer-2");

//cart
const cartBodyContainer = document.getElementById("cartBody-container");
const btnAddToCartEl = document.getElementById("btnAddToCart");

openModalBtn?.addEventListener("click", function () {
  itemDetailsModalEl.style.display = "block";
});

window.addEventListener("click", function (event) {
  if (event.target === itemDetailsModalEl) {
    itemDetailsModalEl.style.display = "none";
    itemDetailsModalEl.innerHTML = "";
  }
});

if (
  window.location.pathname === "/" ||
  window.location.pathname === "/index.html"
) {
  fetchMenuDataFromFirebase();
} else if (window.location.pathname === "/cart.html") {
  fetchCartDataFromFirebase();
}

const menuCardHtml = (foodData, isLarge = false) =>
  `<div class="menu-card ${isLarge && "large"}">
<div class="image-container">
  <img
    src="${foodData?.image}"
    alt="${foodData?.foodName}"
  />
</div>
<div>
  <div class="content-container">
    <div class="text-container">
      <div class="title">${foodData?.foodName}</div>
      <div class="address">${foodData?.location}</div>
    </div>
    <div>${foodData?.rating}</div>
  </div>
</div>
</div>`;

const itemDetailsModalHtml = (foodData) => {
  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");

  const closeButton = document.createElement("div");
  closeButton.classList.add("close");
  const closeIcon = document.createElement("i");
  closeIcon.classList.add("fa-solid", "fa-arrow-left");
  closeButton.appendChild(closeIcon);
  closeButton.addEventListener("click", () => {
    itemDetailsModalEl.style.display = "none";
    itemDetailsModalEl.innerHTML = "";
  });

  const itemDetailsContainer = document.createElement("div");
  itemDetailsContainer.classList.add("itemDetails-container");

  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  const image = document.createElement("img");
  image.src = foodData?.image;
  image.alt = foodData?.foodName;
  imageContainer.appendChild(image);

  const contentContainer = document.createElement("div");
  contentContainer.classList.add("content-container");

  const foodName = document.createElement("div");
  foodName.classList.add("foodName");
  foodName.textContent = foodData?.foodName;

  const foodDetailsContainer = document.createElement("div");
  foodDetailsContainer.classList.add("foodDetailsContainer");
  const emptyDivFoodDetails = document.createElement("div");
  const foodType = document.createElement("div");
  foodType.classList.add("foodType");
  foodType.textContent = foodData?.type;
  const calories = document.createElement("div");
  calories.classList.add("Calories");
  calories.textContent = `Total Calories: ${foodData?.calories}`;
  const price = document.createElement("div");
  price.classList.add("price");
  price.textContent = `${foodData?.price}`;
  emptyDivFoodDetails.appendChild(foodType);
  emptyDivFoodDetails.appendChild(calories);
  foodDetailsContainer.appendChild(emptyDivFoodDetails);
  foodDetailsContainer.appendChild(price);

  const description = document.createElement("div");
  description.classList.add("description");
  description.textContent = foodData?.description;

  const nutritionalValueContainer = document.createElement("div");
  nutritionalValueContainer.classList.add("nutritionalValue-container");
  const title = document.createElement("div");
  title.classList.add("title");
  title.textContent = "Nutritional Value";
  const nutritionalItemContainers = [
    { label: "Protien", value: "170" },
    { label: "Fiber", value: "100" },
    { label: "Fat", value: "200" },
  ];
  nutritionalItemContainers.forEach((item) => {
    const nutritionalItemContainer = document.createElement("div");
    nutritionalItemContainer.classList.add("nutritional-item-container");
    const label = document.createElement("div");
    label.textContent = item.label;
    const value = document.createElement("div");
    value.textContent = item.value;
    nutritionalItemContainer.appendChild(label);
    nutritionalItemContainer.appendChild(value);
    nutritionalValueContainer.appendChild(nutritionalItemContainer);
  });

  const addToCartButton = document.createElement("button");
  addToCartButton.id = "btnAddToCart";
  addToCartButton.textContent = "Add to Cart";
  addToCartButton.addEventListener("click", () => {
    postCartDataToFirebase(foodData);
  });

  // Append elements to the structure
  modalContent.appendChild(closeButton);
  itemDetailsContainer.appendChild(imageContainer);
  contentContainer.appendChild(foodName);
  contentContainer.appendChild(foodDetailsContainer);
  contentContainer.appendChild(description);
  contentContainer.appendChild(nutritionalValueContainer);
  contentContainer.appendChild(addToCartButton);
  itemDetailsContainer.appendChild(contentContainer);
  modalContent.appendChild(itemDetailsContainer);

  return modalContent;
};

const cartItemHtml = (cartData) => {
  // Create cartItem element
  const cartItem = document.createElement("div");
  cartItem.classList.add("cartItem");

  // Create cart-close div
  const cartClose = document.createElement("div");
  cartClose.classList.add("cart-close");
  const closeIcon = document.createElement("i");
  closeIcon.classList.add("fa-solid", "fa-xmark");
  cartClose.appendChild(closeIcon);
  cartClose.addEventListener("click", () => removeItemFromCart(cartData?.id));

  const contentContainer = document.createElement("div");
  contentContainer.classList.add("content-container");

  const imageContainer = document.createElement("div");
  imageContainer.classList.add("image-container");
  const img = document.createElement("img");
  img.src = cartData?.image;
  img.alt = "";
  imageContainer.appendChild(img);

  const rightSection = document.createElement("div");
  rightSection.classList.add("rightSection");

  const rightSectionTop = document.createElement("div");
  rightSectionTop.classList.add("rightSection-top");
  const foodName = document.createElement("div");
  foodName.classList.add("foodName");
  foodName.textContent = cartData?.foodName;

  const rateContainer = document.createElement("div");
  rateContainer.classList.add("rateContainer");
  const minusContainer = document.createElement("div");
  minusContainer.classList.add("minusContainer");
  const minusIcon = document.createElement("i");
  minusIcon.classList.add("fa-solid", "fa-square-minus");
  minusContainer.appendChild(minusIcon);
  minusContainer.addEventListener("click", () =>
    onPressQuantityUpdate(cartData?.id, cartData?.quantity, false)
  );

  const qty = document.createElement("div");
  qty.classList.add("qty");
  qty.textContent = cartData?.quantity;
  const plusContainer = document.createElement("div");
  plusContainer.classList.add("plusContainer");
  const plusIcon = document.createElement("i");
  plusIcon.classList.add("fa-solid", "fa-square-plus");
  plusContainer.appendChild(plusIcon);
  plusContainer.addEventListener("click", () =>
    onPressQuantityUpdate(cartData?.id, cartData?.quantity, true)
  );

  rateContainer.appendChild(minusContainer);
  rateContainer.appendChild(qty);
  rateContainer.appendChild(plusContainer);
  rightSectionTop.appendChild(foodName);
  rightSectionTop.appendChild(rateContainer);

  // Create textType divs
  const textType1 = document.createElement("div");
  textType1.classList.add("textType");
  textType1.textContent = cartData?.type;
  const textType2 = document.createElement("div");
  textType2.classList.add("textType");
  textType2.textContent = `$${cartData?.price * cartData?.quantity}`;

  // Append elements to the structure
  rightSection.appendChild(rightSectionTop);
  rightSection.appendChild(textType1);
  rightSection.appendChild(textType2);
  contentContainer.appendChild(imageContainer);
  contentContainer.appendChild(rightSection);
  cartItem.appendChild(cartClose);
  cartItem.appendChild(contentContainer);

  return cartItem;
};

function fetchMenuDataFromFirebase() {
  firebase
    .firestore()
    .collection(FOOD_DATA_COLLECTION)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const foodData = doc.data();
          menuData.push(foodData);
          const tempContainer = document.createElement("div");
          tempContainer.innerHTML = menuCardHtml(foodData);
          const menuCard = tempContainer.firstChild;
          menuCard?.addEventListener("click", () => {
            menuCardClickListener(foodData);
          });
          menuCardsContainerEl.appendChild(menuCard);
        });

        menuData.forEach((foodData) => {
          const tempContainer = document.createElement("div");
          tempContainer.innerHTML = menuCardHtml(foodData);
          const menuCard = tempContainer.firstChild;
          menuCard.addEventListener("click", () => {
            menuCardClickListener(foodData);
          });
          menuCardsContainerDealEl.appendChild(menuCard);
        });

        const tempLargeCard1 = document.createElement("div");
        tempLargeCard1.innerHTML = menuCardHtml(menuData[2], true);
        const largeCard1 = tempLargeCard1.firstChild;

        const tempLargeCard2 = document.createElement("div");
        tempLargeCard2.innerHTML = menuCardHtml(menuData[3], true);
        const largeCard2 = tempLargeCard2.firstChild;

        largeCard1.addEventListener("click", () => {
          menuCardClickListener(menuData[2]);
        });

        largeCard2.addEventListener("click", () => {
          menuCardClickListener(menuData[3]);
        });
        largeCardContainer1.appendChild(largeCard1);
        largeCardContainer2.appendChild(largeCard2);
      }
    })
    .catch((error) => {
      console.log("Error getting data:", error);
    });
}

function fetchCartDataFromFirebase() {
  firebase
    .firestore()
    .collection(CART_DATA_COLLECTION)
    .onSnapshot((querySnapshot) => {
      cartBodyContainer.innerHTML = "";
      querySnapshot?.forEach((doc) => {
        const cartData = doc.data();
        cartBodyContainer.appendChild(cartItemHtml(cartData));
      });
    });
}

const menuCardClickListener = (foodData) => {
  itemDetailsModalEl.appendChild(itemDetailsModalHtml(foodData));
  itemDetailsModalEl.style.display = "block"; // Show modal
};

function postCartDataToFirebase(foodData) {
  const cartObject = {
    id: foodData.id,
    type: foodData.type,
    foodName: foodData.foodName,
    quantity: 1,
    image: foodData.image,
    price: foodData.price,
  };

  firebase
    .firestore()
    .collection(CART_DATA_COLLECTION)
    .doc(foodData.id)
    .set(cartObject)
    .then(() => {
      alert("Item successfully added to cart.");
    })
    .catch((err) => {
      alert(`Error adding to Cart: ${JSON.stringify(err)}`);
    });
}

function removeItemFromCart(docId) {
  firebase
    .firestore()
    .collection(CART_DATA_COLLECTION)
    .doc(docId)
    .delete()
    .then(() => {})
    .catch((err) => {
      alert(`Failed to remove from Cart: ${JSON.stringify(err?.message)}`);
    });
}

function onPressQuantityUpdate(docId, currentQty, increment) {
  firebase
    .firestore()
    .collection(CART_DATA_COLLECTION)
    .doc(docId)
    .update({
      quantity: increment ? currentQty + 1 : Math.max(currentQty - 1, 1),
    })
    .catch((err) => {
      console.log(err);
    });
}

//notifications
channel?.addEventListener("message", function (event) {
  const message = event.data;
  displayMessage(message);
});

function displayMessage(message) {
  alert(message);
}

btnAddToCartEl?.addEventListener("click", () => {
  notificationHandler();
});

function notificationHandler() {
  //Checking the notification permission
  Notification.requestPermission().then((permission) => {
    if (permission == "granted") {
      sendNotification();
    } else {
      alert("Please manually enable notifications");
    }
  });
}

function sendNotification() {
  if ("Notification" in window && "serviceWorker" in navigator) {
    console.log(Notification.permission);
    switch (Notification.permission) {
      case "default":
        break;
      case "granted":
        //send from here
        const title = "FoodMunch Status";
        const body = "Your order is being prepared.";
        const notificationOptions = {
          body,
          icon: "icons/favicon-196.png",
          actions: [
            {
              action: "okay",
              title: "Okay",
            },
          ],
        };
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, notificationOptions);
        });
        break;
      case "denied":
        alert("Please manually enable notifications");
        break;
    }
  } else {
    alert("Please manually enable notifications");
  }
}
