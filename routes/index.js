var express = require('express');
var router = express.Router();

// Importation mongoose
var mongoose= require('mongoose');

// Importation de bcryptjs
var bcrypt = require('bcryptjs');


// Connexion à la DB
var options = { server: { socketOptions: {connectTimeoutMS: 5000 } }};
mongoose.connect('mongodb://thomas:mdp123@ds225543.mlab.com:25543/commandes',
    options,
    function(err) {
     console.log(err);
    }
);


//=============================================================================================================================================

/* Création des schémas */

//Schéma User
var userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    phone: String,
    address: String,
    zipcode: Number,
    imageURL: String
    });

// Lien du schéma user avec le modèle
var UserModel = mongoose.model('users', userSchema);

//Schéma commande
var orderSchema = mongoose.Schema({
    totalInvoice: Number,
    deliveryPrice: Number,
    userOrdering: String
    });

// Lien du schéma commande avec le modèle
var OrderModel = mongoose.model('orders', orderSchema);

//=============================================================================================================================================



/* Initialisation de la home page. */
router.get('/', function(req, res, next) {
  res.render('index', {connexion: "false"});
});


//=============================================================================================================================================

/* Check login - connexion à la page de compte ou bien rechargement de la page */
router.post('/login', function(req, res, next) {

  console.log("Email saisi : " + req.body.emailTyped);
  console.log("Pwd saisi : " + req.body.passwordTyped);

  UserModel.find(
    {email: req.body.emailTyped},

    function(err, userTried) {
      // Comparaison password saisi/password hashé
      bcrypt.compare(req.body.passwordTyped, userTried[0].password, function(err, response) {

        if (response) {
          var userLogged = userTried[0];
          console.log("Bon mot de passe");
          req.session.user = userTried[0];
          res.render('account', {userLogged});
        }
        else {
          console.log("Mauvais mot de passe");
          res.render('index', {connexion: "false"});
        }

      });
    }
    )
  }
);

//=============================================================================================================================================

/* Page validation inscription et ajout dans base de données*/
router.post('/inscription', function(req, res, next) {

  // Enregistrement du nouvel utilisateur après envoi du formulaire de la page de landing
    // Hashage du mot de passe

  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(req.body.password, salt, function(err, hash) {
      // Création du nouvel utilisateur
      var newUser = new UserModel ({
       lastName: req.body.lastName,
       firstName: req.body.firstName,
       email: req.body.email,
       password: hash,
       phone: req.body.phone,
       address: req.body.address,
       zipcode: req.body.zipcode,
       imageURL: "./images/avatar-1.jpg"
      });

      console.log("Contenu newUser");
      console.log(newUser);

      newUser.save(
          function (error, user) {
            // Ouverture de la session de l'utilisateur
            UserModel.find(
              { email: req.body.email },
              function(err, loggedUser){

                // Création de la session

                req.session.user = loggedUser[0];
                var userLogged = req.session.user;
                res.render('inscription', {userLogged});
    }
            )

    }
      );

    });


    });
});




//=============================================================================================================================================


/* Page account - généré à partir d'un profil random et modification du profil à gérer + rechargement de la page */
router.post('/account', function(req, res, next) {

// On récupère l'utilisateur choisi
        console.log("Chargement de la page account - Contenu req.session.user :");
        console.log(req.session.user);
       userLogged = req.session.user;
    res.render('account', {userLogged});


});

//=============================================================================================================================================


/* Page accountupdate - on update le compte utilisateur et on affiche la page account */
router.post('/accountUpdate', function(req, res, next) {

  // On filtre via l'id l'utilisateur concerné et on remplace tous les champs par leurs anciennes ou nouvelles valeurs

  console.log("Contenu de req.session.user.id ");
  console.log(req.session.user._id);



  UserModel.update(
      { _id: req.session.user._id},
      { "$set": {
        "firstName": req.body.firstName,
        "lastName": req.body.lastName,
        "email": req.body.email,
        "phone": req.body.phone,
        "address": req.body.address,
        "zipcode": req.body.zipcode
        }
      },

    function(error, raw) {
      //On recherche le nouveau contenu du document
      UserModel.find(

        { _id: req.session.user._id},
        function(err, loggedUser){
          console.log("Contenu de loggedUser");

          console.log(loggedUser);

          //on update la session
          req.session.user = loggedUser[0];

          console.log(req.session.user);
          userLogged = req.session.user;

          res.render('account', {userLogged});
        }
      )
    }
  );
});



//=============================================================================================================================================

/* Page account - généré à partir d'un profil random et modification du profil à gérer + rechargement de la page */

router.post('/order', function(req, res, next) {

      // Récupérer le panier du client concerné
      console.log("Contenu de la session de  la personne dont on charge l'order: ");
      console.log(req.session.user);

      OrderModel.find(
        { userOrdering: req.session.user._id},
        function(err, basketLoggedUser) {
          res.render('order', {basket: basketLoggedUser, userLogged: req.session.user});
        });
});


module.exports = router;



//=============================================================================================================================================


/* Page orderAdd - on ajoute une commande random pour l'utilisateur conencté */
router.post('/orderAdd', function(req, res, next) {

  // On filtre via l'id l'utilisateur concerné et on remplace tous les champs par leurs anciennes ou nouvelles valeurs
  var newOrder = new OrderModel ({
   totalInvoice: Math.round(Math.random() * 1000),
   deliveryPrice: Math.round(Math.random() * 10),
   userOrdering: req.session.user._id
  });

  newOrder.save(
    function(err, order) {
      OrderModel.find(
        {userOrdering: req.session.user._id},
        function(err, basketLoggedUser) {
          res.render('order', {
            basket: basketLoggedUser,
            userLogged: req.session.user
          });
        }
      )
    }
  )

});
