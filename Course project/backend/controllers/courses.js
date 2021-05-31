const fs = require('fs');
const Course = require('../models/course');
// Removes empty strings, in our case remove arr strings generated by formData obj
const filterEmptyArr = (arr) => arr.filter(el => el !== '');

exports.getCourse = (req, res, next) => {
    Course.findById({ _id: req.params.id }).then(result => {
        res.status(200).json({
            message: "Posts fetched successfully!",
            courses: [result]
        });
    })
}

exports.getCourses = async (req, res, next) => {
    const documents = await Course.find();
    res.status(200).json({
        message: "Courses fetched successfully!",
        courses: documents
    });
    // Course.find().then(documents => {
    //     res.status(200).json({
    //         message: "Courses fetched successfully!",
    //         courses: documents
    //     });
    // });
}

exports.createCourse = (req, res, next) => {

    const siteUrl = req.protocol + "://" + req.get("host");
    const imgFile = siteUrl + "/courses-project/images/" + req.file.filename;
    
    const course = new Course({
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        imgFile: imgFile,
        date: req.body.date,
        likes: JSON.parse(req.body.likes),
        rating: JSON.parse(req.body.rating),
        categories: JSON.parse(req.body.categories),
    })

    course.likes = filterEmptyArr(course.likes)
    course.rating = filterEmptyArr(course.rating)
    course.categories = filterEmptyArr(course.categories)

    course.save().then(createdCourse => {
        res.status(201).json({
            message: "Post added successfully",
            postId: createdCourse._id
        });
    });

}

exports.editCourse = (req, res, next) => {


    let imgFile = req.body.imgFile;
    if (req.file) {
        const siteUrl = req.protocol + "://" + req.get("host");
        imgFile = siteUrl + "/courses-project/images/" + req.file.filename;
    }

    // Convert id to _id and update post
    const course = new Course({
        _id: req.body.id,
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        imgFile: imgFile,
        date: req.body.date,
        likes: filterEmptyArr(JSON.parse(req.body.likes)),
        rating: filterEmptyArr(JSON.parse(req.body.rating)),
        categories: filterEmptyArr(JSON.parse(req.body.categories)),
    })

    Course.findOne({ _id: req.params.id }).then((foundCourse) => {

        // Check ratings
        if (foundCourse.rating.find((obj) => obj.email == req.email) !== undefined && JSON.stringify(foundCourse.rating) != JSON.stringify(course.rating)) {
            res.status(409).json({ message: "You already rated this course!" });
            return;
        }
        // If rate is less than 1 and more than 5 show error
        if (course.rating.find((item) => !(item.rate >= 1 && item.rate <= 5)) !== undefined) {
            res.status(409).json({ message: "Your rate must be between 1 and 5" });
            return;
        }

        // Get file name from splited url
        // If image update then delete old one if not keep it in database
        let fileName, path;
        if (req.file) {
            fileName = foundCourse.imgFile.split('/')[foundCourse.imgFile.split('/').length - 1];
            path = `${process.env.BACKEND_IMAGE_FOLDER ? process.env.BACKEND_IMAGE_FOLDER : ""}images/` + fileName;
        }

        Course.updateOne({ _id: req.params.id }, course).then(result => {
            // Delete old image if it has path
            try {
                if (fs.existsSync(path)) {
                    fs.unlinkSync(path)
                }
                //file removed
            } catch (err) {
                console.error(err)
            }
            res.status(200).json({ message: "Update successful!" });
        });

    })


}

exports.deleteCourse = (req, res, next) => {
    Course.findOne({ _id: req.params.id }).then((foundCourse) => {

        // Get file name from splited url
        let fileName = foundCourse.imgFile.split('/')[foundCourse.imgFile.split('/').length - 1];
        let path = `${process.env.BACKEND_IMAGE_FOLDER ? process.env.BACKEND_IMAGE_FOLDER : ""}images/` + fileName;
        
        Course.deleteOne({ _id: req.params.id }).then(result => {
            try {
                fs.unlinkSync(path)
                //file removed
            } catch (err) {
                console.error(err)
            }
            res.status(200).json({ message: "Post deleted!" });
        });

    })
}

