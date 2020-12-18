const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');
const Profile = require('../../models/Profile');

//@route    GET api/profile/me
//@desc     Get currrent Users profile
//@access   Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id,
        }).populate('user', ['name', 'avatar']);
        if (!profile) {
            return res.status(400).json({ msg: 'No profile for current User' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    POST api/profile
//@desc     Create or Update user's profile
//@access   Private
router.post(
    '/',
    [
        auth,
        check('status', 'Staus is required').not().isEmpty(),
        check('skills', 'Skills are required').not().isEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req); // Check if Errors
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            company,
            location,
            website,
            bio,
            skills,
            status,
            githubusername,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
        } = req.body;

        //Build profile
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills
                .split(',')
                .map((skill) => skill.trim());
        }

        //Build Profile Social
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (facebook) profileFields.social.facebook = facebook;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (instagram) profileFields.social.instagram = instagram;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                //Update
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );

                return res.json(profile);
            }

            //Create
            profile = new Profile(profileFields);
            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

//@route    GET api/profile
//@desc     Get all Profiles
//@access   Public

router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', [
            'name',
            'avatar',
        ]);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    GET api/profile/user/:user_id
//@desc     Get profile by user ID
//@access   Public

router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id,
        }).populate('user', ['name', 'avatar']);

        if (!profile) return res.status(400).json({ msg: 'Profile Not Found' });
        res.json(profile);
    } catch (err) {
        console.error(err.message);

        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile Not Found' });
        }
        res.status(500).send('Server Error');
    }
});

//@route    DELETE api/profile
//@desc     Delete User,Profile & Posts
//@access   Private

router.delete('/', auth, async (req, res) => {
    try {
        //@todo-Delete Posts

        //Remove Profile
        await Profile.findOneAndRemove({ user: req.user.id });

        //Remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User Deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    PUT api/profile/experience
//@desc     Add experience to the profile
//@access   Private

router.put(
    '/experience',
    [
        auth,
        [
            check('title', 'Title is Required').not().isEmpty(),
            check('company', 'Company is Required').not().isEmpty(),
            check('from', 'From Date is Required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        } = req.body;

        const newExp = {
            title,
            company,
            location,
            from,
            to,
            current,
            description,
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            // Appending in the array
            profile.experience.unshift(newExp);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

//@route    DELETE api/profile/experience/:exp_id
//@desc     Delete Experience
//@access   Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // To get the id or index of the experience to be removed
        const removeIndex = await profile.experience
            .map((item) => item.id)
            .indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    PUT api/profile/education
//@desc     Add education to the profile
//@access   Private

router.put(
    '/education',
    [
        auth,
        [
            check('school', 'School is Required').not().isEmpty(),
            check('degree', 'Degree is Required').not().isEmpty(),
            check('fieldofstudy', 'Field of Study is Required').not().isEmpty(),
            check('from', 'From Date is Required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        } = req.body;

        const newEdu = {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description,
        };

        try {
            const profile = await Profile.findOne({ user: req.user.id });

            // Appending in the array
            profile.education.unshift(newEdu);

            await profile.save();

            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

//@route    DELETE api/profile/education/:edu_id
//@desc     Delete Education
//@access   Private

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // To get the id or index of the education to be removed
        const removeIndex = await profile.education
            .map((item) => item.id)
            .indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    GET api/profile/github/:username
//@desc     Get repos of user
//@access   Public

router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username
            }/repos?per_page=5&sorted=created:asc&client_id=${config.get(
                'githubClientId'
            )}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node-js' },
        };

        request(options, (error, response, body) => {
            if (error) console.error(error);

            if (response.statusCode !== 200) {
                res.status(404).json({ msg: 'No Github profile Found' });
            }

            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
