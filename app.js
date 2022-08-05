const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://<userName>:<password>@cluster0.rhkp6a0.mongodb.net/todoList?retryWrites=true&w=majority",
  {
    useNewUrlParser: true
  }
);

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to todoList."
});

const item2 = new Item({
    name: "Click + button to add a new item"
});

const item3 = new Item({
    name: "<-- click this to delete/remove item."
});

const defaultArray = [item1, item2, item3]; 
 
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/",function(req,res) {

    Item.find({}, function(err, foundItems){

        if(foundItems.length===0){
            Item.insertMany(defaultArray,function(err){
                if(err) { console.log(err);}
                else {
                    console.log("successfully added default items!");
                }
        });
        res.redirect("/");
            }
        else {
            res.render("list",{listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.get("/:customListName",function(req, res) {
    
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err) { 
            if(!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultArray
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
});

app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;
  
    const item = new Item({
      name: itemName
    });
  
    if (listName === "Today"){
      item.save();
      res.redirect("/");
    } else {
      List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      });
    }
  });


app.post("/delete",function(req,res) {
    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;
    
    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItem,function(err){
            if(!err) { 
                console.log("deleted!"); }
            res.redirect("/");
        });
        } else {
        
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}},function(err,foundList) {
            if(!err) {
                res.redirect("/"+ listName );
            }
        });
        }
});


app.listen(process.env.PORT || 3000);
