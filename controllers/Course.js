const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
// Function to create a new course
exports.createCourse = async (req, res) => {
	try {
		// Get user ID from request object
		const userId = req.user.id;

		// Get all required fields from request body
		let {
			courseName,
			courseDescription,
			whatYouWillLearn,
			price,
			tag,
			category,
			status,
			instructions,
		} = req.body;

		// Get thumbnail image from request files
		const thumbnail = req.files.thumbnailImage;

		// Check if any of the required fields are missing
		if (
			!courseName ||
			!courseDescription ||
			!whatYouWillLearn ||
			!price ||
			!tag ||
			!thumbnail ||
			!category
		) {
			return res.status(400).json({
				success: false,
				message: "All Fields are Mandatory",
			});
		}
		if (!status || status === undefined) {
			status = "Draft";
		}
		// Check if the user is an instructor
		const instructorDetails = await User.findById(userId, {
			accountType: "Instructor",
		});

		if (!instructorDetails) {
			return res.status(404).json({
				success: false,
				message: "Instructor Details Not Found",
			});
		}

		// Check if the tag given is valid
		const categoryDetails = await Category.findById(category);
		if (!categoryDetails) {
			return res.status(404).json({
				success: false,
				message: "Category Details Not Found",
			});
		}
		// Upload the Thumbnail to Cloudinary
		const thumbnailImage = await uploadImageToCloudinary(
			thumbnail,
			process.env.FOLDER_NAME
		);
		console.log(thumbnailImage);
		// Create a new course with the given details
		const newCourse = await Course.create({
			courseName,
			courseDescription,
			instructor: instructorDetails._id,
			whatYouWillLearn: whatYouWillLearn,
			price,
			tag: tag,
			category: categoryDetails._id,
			thumbnail: thumbnailImage.secure_url,
			status: status,
			instructions: instructions,
		});

		// Add the new course to the User Schema of the Instructor
		await User.findByIdAndUpdate(
			{
				_id: instructorDetails._id,
			},
			{
				$push: {
					courses: newCourse._id,
				},
			},
			{ new: true }
		);
		// Add the new course to the Categories
		await Category.findByIdAndUpdate(
			{ _id: category },
			{
				$push: {
					course: newCourse._id,
				},
			},
			{ new: true }
		);
		// Return the new course and a success message
		res.status(200).json({
			success: true,
			data: newCourse,
			message: "Course Created Successfully",
		});
	} catch (error) {
		// Handle any errors that occur during the creation of the course
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Failed to create course",
			error: error.message,
		});
	}
};

exports.getAllCourses = async (req, res) => {
	try {
		const allCourses = await Course.find(
			{},
			{
				courseName: true,
				price: true,
				thumbnail: true,
				instructor: true,
				ratingAndReviews: true,
				studentsEnroled: true,
			}
		)
			.populate("instructor")
			.exec();
		return res.status(200).json({
			success: true,
			data: allCourses,
		});
	} catch (error) {
		console.log(error);
		return res.status(404).json({
			success: false,
			message: `Can't Fetch Course Data`,
			error: error.message,
		});
	}
};

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    const courseDetails = await Course.findById(courseId)
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection", // ✅ Corrected path
        },
      })
      .exec();

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find the course with ID ${courseId}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course Details fetched successfully",
      data: courseDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// -------------------------------------------------------

// const Course=require("../models/Course")
// const Tag=require("../models/Category")
// const User=require("../models/User")
// const {uploadImageCloudinary}=require("../utils/imageUploader")

// // createCourse handler function
// exports.createCourse = async (req,res) => {
//     try{

//         // fetch data
//         const {courseName, courseDescription, whatYouWillLearn, price, tag} = req.body;

//         // get thumbnail
//         const thumbnail=req.files.thumbnailImage;

//         // validation
//         if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail){
//             return res.status(400).json({
//                 success:false,
//                 message:'All fields are required'
//             })
//         }

//         // check for instructor
//         // while creating new course we need to pass instuctor object id
//         // so we have instructor user id using which we get all details of instructor from db
//         // and then use that object id further
//         const userId = req.user.id;
//         const instructorDetails = await User.findById(userId)
//         console.log("Instructor Details ",instructorDetails)

//         if(!instructorDetails){
//             return res.status(404).json({
//                 success:false,
//                 message:'Instructor Details not found'
//             })
//         }

//         // check given tag is valid or not
//         const tagDetails = await Tag.findById(tag)
//         if(!tagDetails){
//             return res.status(404).json({
//                 success:false,
//                 message:'Tag Details not found'
//             })
//         }

//         // Upload image to cloudinary
//         const thumbnailImage = await uploadImageCloudinary(thumbnail,process.env.FOLDER_NAME)

//         // create an entry for new Course
//         const newCourse = await Course.create({
//             courseName,
//             courseDescription,
//             instructor:instructorDetails._id,
//             whatYouWillLearn: whatYouWillLearn,
//             price,
//             tag:tagDetails._id,
//             thumbnail:thumbnailImage.secure_url
//         })

//         // add the new course to the user schema of Instructor
//         // UPDATE IS ---> user ke andar ,course ke array ke andar , course ke id insert karna chahte hai
//         await User.findByIdAndUpdate(
//             {_id:instructorDetails._id},
//             {
//                 $push:{
//                     courses:newCourse._id
//                 }
//             },
//             // jo response mile vo updated response milna chahiye
//             {new:true}
//         )

//         // update the TAG ka schema ------->>>>HW
//         await Tag.findByIdAndUpdate(
//             {_id:tagDetails._id},
//             {
//                 $push:{
//                     course:newCourse._id
//                 }
//             },
//             // jo response mile vo updated response milna chahiye
//             {new:true}
//         )

//         // return response
//         return res.status(200).json({
//             success:true,
//             message:'Course Created Successfully',
//             data:newCourse
//         })
//     }
//     catch(error){
//         console.log(error)
//         return res.status(500).json({
//             success:false,
//             message:'Failed to create Course',
//             error:error.message
//         })
//     }
// }





// // getAllCourses handler function

// exports.showAllCourses = async (req,res) =>{
//     try{
//         // const allCourses = await Course.find({},{courseName:true,
//         //                                         price:true,
//         //                                         thumbnail:true,
//         //                                         instructor:true,
//         //                                         ratingAndReviews:true,
//         //                                         studentsEnrolled:true 
//         // }).populate("instructor").exec()
//         const allCourses = await Course.find({})

//         return res.status(200).json({
//             success:true,
//             message:'Data for all courses fetched successfully',
//             data:allCourses
//         })
//     }
//     catch(error){
//         console.log(error)
//         return res.status(500).json({
//             success:false,
//             message:'Cannot Fetch course data',
//             error:error.message
//         })
//     }
// }
