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

function showLoading(){$("#loading").show();$("#modal-backdrop").removeClass("d-none");$("body").css("overflow","hidden");}
function hideLoading(){$("#loading").hide();$("#modal-backdrop").addClass("d-none");$("body").css("overflow","auto");}

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

var infoURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRerb-WigKsbh1K6uRrr2Q24G50b_HVKgXWLwevDCTsuHQV8hnVgoT6ZatxoKRkWqevR_CK5lKt-XLV/pub?gid=82563433&single=true&output=csv";
var dataURL = "https://script.google.com/macros/s/AKfycbxM-adOujLUNRf1kdfeVLZMDTAkJtHuHWf6k920waMKjr4Wbmo/exec";
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
    showLoading();

    if(window.location.hash && window.location.hash == "#cart") {
      this.content = "cart";
    }

    var self = this; // create a closure to access component in the callback below
    self.profile = getFromStorage("profile");


    $.get(infoURL,function(data){
      $("#info").html(data.replace(/\n/g, "<br />").replace(/\"/g, ""));
    });

    $.getJSON(dataURL, function(data) {
      self.items = data.items;
      self.cartItems = getFromStorage("cartItems");

      if (self.cartItems.length > 0) {
        var newCartItems = [];    

        self.cartItems.forEach(function(cartItem, index){
          // data.items.filter(d => d.id===cartItem.id).forEach((obj) => {
          //   obj["quantity"] = parseInt(cartItem.quantity);
          //   newCartItems.push(obj);
          // });
          data.items.filter((obj, index) => {
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

      hideLoading();
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
    clearCart(){
      this.cartItems = [];
      this.cartList = [];
      saveToStorage("cartItems", []);
    },
    submitOrder(){
      if(this.profile.name && this.profile.whatsapp && this.profile.address){
        var clientProfile = {name:this.profile.name,whatsapp:this.profile.whatsapp,address:this.profile.address};
        saveToStorage("profile", clientProfile);
      }
      var myerrors = [];
      var orders = [];
      this.errors = [];

      if (!this.profile.name) {
        myerrors.push('请填写您的名字。');
      }
      if (!this.profile.whatsapp) {
        myerrors.push('需要您的WhatsApp号码');
      }
      if (!this.profile.address) {
        myerrors.push('请填写地址。');
      }

      this.cartItems.forEach(cartItem => {
        box = $("#p-"+cartItem.id).find(".input-qty");
        if(cartItem.quantity > 0){
          //ok
          box.removeClass("error");
          orders.push({id:cartItem.id,quantity:cartItem.quantity});
        }
        else {
          box.addClass("error");
          myerrors.push('请确保 "'+cartItem.product_title+'" 有填写数量。');
        }
      });

      this.errors = myerrors;

      if(myerrors.length == 0){
        //submit
        var that = this;
        showLoading();
        var args = {url:dataURL,data:JSON.stringify({profile:clientProfile,orders:orders}),dataType:"json",crossDomain: true};
        $.post(args, function(d){
            if(d.status == 1){
              // that.clearCart();
            }
            else{}
            that.content = "order_messeges";
            setTimeout(function(){$("#order_messeges").html(d.messages.replace(/\n/g, "<br />"));},"200");
            hideLoading();
        });
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
