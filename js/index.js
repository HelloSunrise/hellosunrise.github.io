function formatNumber(n, c, d, t){
	var currency = "RM";
	var c = isNaN(c = Math.abs(c)) ? 2 : c, 
			d = d === undefined ? '.' : d, 
			t = t === undefined ? ',' : t, 
			s = n < 0 ? '-' : '', 
			i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))), 
			j = (j = i.length) > 3 ? j % 3 : 0;
	return currency + " " + s + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
}

function getFromStorage(item){
    if (typeof(Storage) !== "undefined") {
      if (localStorage[item]) {
        return JSON.parse(localStorage[item]);
      }
    } else {
      // Sorry! No Web Storage support..
    }
    return [];
}

function saveToStorage(item, value){
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem(item, JSON.stringify(value));
      return true;
    } else {
      // Sorry! No Web Storage support..
    }
    return false;
}

var sticky = 0;
window.onscroll = function() {
  var header = $(".button-tab")[0];
  if(sticky == 0){
    sticky = header.offsetTop;
  }

  if (window.pageYOffset > sticky) {
    header.classList.add("sticky");
  }
  else {
    header.classList.remove("sticky");
    sticky = 0;
  }
};

// Allow the formatNumber function to be used as a filter
Vue.filter('formatCurrency', function (value) {
	return formatNumber(value, 2, '.', ',');
});

dataURL = "https://script.google.com/macros/s/AKfycbxM-adOujLUNRf1kdfeVLZMDTAkJtHuHWf6k920waMKjr4Wbmo/exec";
const vm = new Vue({
  el: '#app',
	
  data: {
    items : [],
    cartItems: [],
    cartList: [],
    content: "home",
    profile : {name:"", whatsapp:"", address:""},
    errors: [],
  },

  mounted() { // when the Vue app is booted up, this is run automatically.
    var self = this; // create a closure to access component in the callback below
    $("#loading").removeClass("d-none");
    self.profile = getFromStorage("profile");

    $.getJSON(dataURL, function(data) {
      self.items = data;
      self.cartItems = getFromStorage("cartItems");

      if (self.cartItems.length > 0) {
        var newCartItems = [];    

        self.cartItems.forEach(function(cartItem, index){
          // data.filter(d => d.id===cartItem.id).forEach((obj) => {
          //   obj["quantity"] = parseInt(cartItem.quantity);
          //   newCartItems.push(obj);
          // });
          data.filter((obj, index) => {
            if(obj.id===cartItem.id){
              obj["quantity"] = parseInt(cartItem.quantity);
              newCartItems.push(obj);
              self.cartList.push(index);
            }
          });
        });
        newCartItems = JSON.parse(JSON.stringify(newCartItems));
        self.cartItems = newCartItems;

        saveToStorage("cartItems", newCartItems);
      }

      $("#loading").hide();
    });
  },
	
  methods: {
    changePage(page){
      this.content = page;
    },
		// Add Items to cart
    addToCart(index) {
      itemToAdd = this.items[index];
      this.cartList.push(index);

      let itemIndex = this.cartItems.findIndex(item => item.id===itemToAdd.id);
      let itemInCart = this.cartItems[itemIndex];

      itemToAdd.quantity = 1;

      if(itemIndex === -1){
        this.cartItems.push(Vue.util.extend({}, itemToAdd));
      }
      else{
        itemInCart.quantity = itemToAdd.quantity;
        this.cartItems[itemIndex] = itemInCart;
      }

      saveToStorage("cartItems", this.cartItems);
			
    },
    // Remove item by its index
    removeFromCart(cartIndex) {
      this.cartItems.splice(cartIndex, 1);
      itemIndex = this.cartList[cartIndex];
      this.items[itemIndex]["quantity"] = 0;
      this.cartList.splice(cartIndex, 1);

      saveToStorage("cartItems", this.cartItems);
    },
    submitOrder(){
      if(this.profile.name && this.profile.whatsapp && this.profile.address){
        var clientProfile = {name:this.profile.name,whatsapp:this.profile.whatsapp,address:this.profile.address};
        saveToStorage("profile", clientProfile);
      }
      this.errors = [];

      if (!this.profile.name) {
        this.errors.push('Name required.');
      }
      if (!this.profile.whatsapp) {
        this.errors.push('WhatsApp required.');
      }
      if (!this.profile.address) {
        this.errors.push('Address required.');
      }
    },
  },

  computed: {
    CartTotal() {
      let total = 0;
      if(this.cartItems.length > 0){
        this.cartItems.forEach(item => {
          price = 0;
          if(item.sales_price!=""){price = item.sales_price;}else{price = item.price;}
          total += (price * item.quantity);
        });
        saveToStorage("cartItems", this.cartItems);
      }
      return total;
    }
  }
});
