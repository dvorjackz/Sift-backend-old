const express = require('express');
const config = require('../config');
const upload = require('../services/file-upload');

const router = express.Router();
const singleUpload = upload.single('image'); 

let Rushee = require('../models/rushee.model');

router.route('/').get((req, res) => {
    Rushee.find()
        .then(rushees => res.json(rushees))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/request-match/:count').get((req, res) => {
    Rushee.aggregate([
        { $sample: {size: parseInt(req.params.count)} }
    ], function(err, rushees) {
        if (err) {
            res.status(400).json('Error: ' + err);
        }
        else {
            res.json(rushees);
        }
    });
});

function winProbability(rating1, rating2) { 
    return 1.0 * 1.0 / (1 + 1.0 *  Math.pow(10, 1.0 * (rating1 - rating2) / 400)); 
}

/*
For client to submit results of a resume match
Rushee of id1 is the winner, rushee of id2 is the loser
*/
router.route('/submit-match/:id1/:id2').post((req, res) => {
    Rushee.find({
        '_id': { $in: [
            req.params.id1,
            req.params.id2
        ]}
    }, function(err, rushees) {
        if (err) {
            res.status(400).json('Error: ' + err);
        }
        else {
            let rushee1 = null;
            let rushee2 = null;
            if (rushees[0]._id == req.params.id1) {
                rushee1 = rushees[0];
                rushee2 = rushees[1];
            }
            else if (rushees[1]._id == req.params.id1) {
                rushee1 = rushees[1];
                rushee2 = rushees[0];
            }
            let elo1 = rushee1.elo;
            let elo2 = rushee2.elo;

            // To calculate the Winning 
            // Probability of Rushee 2
            const p2 = winProbability(elo1, elo2);
        
            // To calculate the Winning 
            // Probability of Rushee 1
            const p1 = winProbability(elo2, elo1); 

            // Rushee 1 wins the match
            elo1 = elo1 + config.app.elo.K * (1.0 - p1);
            elo2 = elo2 + config.app.elo.K * (0.0 - p2);

            // Update new elo's
            rushee1.elo = elo1;
            rushee2.elo = elo2;
        
            rushee1.save()
            .then(rushee2.save())
            .then(res.json("Elo's updated! " + rushee1.firstName + "'s elo: " + rushee1.elo + ", " + rushee2.firstName  + "'s elo: " + rushee2.elo))
            .catch((err) => res.status(400).json('Error: ' + err));
        }
    });
});

router.route('/rankings').get((req, res) => {
    Rushee.find().sort({ elo : -1 })
    .then((rushees) => res.json(rushees))
    .catch((err) => res.status(400).json('Error: ' + err));
});

/* -------------------------------------- CRUD ------------------------------------- */

router.route('/upload-resume').post((req,res) => {
    singleUpload(req, res, function(err) {
        console.log(req.file);

        const fullName = req.file.key;

        var temp = fullName.split(" ");
        temp = temp.slice(-2);
        temp[1] = temp[1].split(".")[0];

        const firstName = temp[0];
        const lastName = temp[1];
        const resume = req.file.location;

        console.log(firstName + ", " + lastName);
        
        const newRushee = new Rushee({"firstName": firstName, 
                                "lastName": lastName, 
                                "resume": resume});

        newRushee.save()
            .then(() => res.json({message: "Rushee  " + firstName + " " + lastName + " was added! Link to resume: " + resume, firstName: firstName, lastName: lastName}))
            .catch(err => res.status(400).json('Error: ' + err));
    });
});

router.route('/add').post((req, res) => {
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const resume = req.body.resume;

    const newRushee = new Rushee({"firstName": firstName, 
                                "lastName": lastName, 
                                "resume": resume});

    newRushee.save()
        .then(() => res.json("Rushee  " + firstName + " " + lastName + " was added!"))
        .catch(err => res.status(400).json('Error: ' + err));
});

router.route('/:id').get((req, res) => {
    Rushee.findById(req.params.id)
        .then((rushee) => res.json(rushee))
        .catch((err) => res.status(400).json('Error: ' + err));
});

router.route('/:id').delete((req, res) => {
    Rushee.findByIdAndDelete(req.params.id)
        .then(() => res.json("Rushee deleted."))
        .catch((err) => res.status(400).json('Error: ' + err));
});

router.route('/').delete((req, res) => {
    Rushee.deleteMany(req.params.id)
        .then(() => res.json("Rushees deleted."))
        .catch((err) => res.status(400).json('Error: ' + err));
});

router.route('/update/:id').post((req, res) => {
    Rushee.findById(req.params.id)
        .then((rushee) => {
            const firstName = req.body.firstName;
            const lastName = req.body.lastName;
            const resume = req.body.resume;
            const elo = req.body.elo;
            
            if (firstName) {
                rushee.firstName = firstName;
            }
            if (lastName) {
                rushee.lastName = lastName;
            }
            if (resume) {
                rushee.resume = resume;
            }
            if (elo) {
                rushee.elo = elo;
            }

            rushee.save()
                .then(() => res.json("Rushee " + rushee.firstName + " " + rushee.lastName + " updated!"))
                .catch((err) => res.status(400).json('Error: ' + err));
        })
        .catch((err) => res.status(400).json('Error: ' + err));
});

module.exports = router;