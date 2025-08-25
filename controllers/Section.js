const Section = require("../models/Section")
const Course= require("../models/Course")

exports.createSection = async(req,res)=>{
    try{

		// Extract the required properties from the request body
        const {sectionName,courseId}=req.body;
		// Validate the input
        if(!(sectionName || courseId)){
            return res.status(400).json({
                success:false,
                message:"Missing required properties"
            })
        }
		// Add the new section to the course's content array
        const newSection = await Section.create({sectionName})
        // update course with section ObjectID
        const updatedCourse = await Course.findByIdAndUpdate(
                                                        courseId,
                                                        {
                                                            $push:{
                                                                courseContent:newSection._id,
                                                            }
                                                        },
                                                        {new:true},
                                                    ).populate({
                                                                path: "courseContent",
                                                                populate: {
                                                                    path: "subSection",
                                                                },
                                                            })
                                                            .exec();
        // HOW : use populate to replace sections/sub-sections both in the updatedCourseDetails
        // return response
        return res.status(200).json({
            success:true,
            message:'Section created successfully',
            updatedCourse
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Internal server error",
            error:error.message
        })
    }
}

exports.updateSection = async(req,res) =>{
    try{

        // data input
        const {sectionName,sectionId} = req.body;
        // data validation
        // if(!sectionName || !sectionId){
        //     return res.status(400).json({
        //         success:false,
        //         message:'Missing Properties'
        //     }) 
        // }

        // update data ---> NO need to change the details in the course when detail in section get changed because inside the course 
        // section we have stored the section ID
        const section = await Section.findByIdAndUpdate(sectionId,{sectionName},{new:true})
        
        // return response
        return res.status(200).json({
            success:true,
            message:'Section Updated Successfully',
            section
        })
    }
    catch(error){
        console.error("Error updating section:", error);
        return res.status(500).json({
            success:false,
            message:"Unable to create Section,please try again",
        })
    }
} 

exports.deleteSection = async(req,res) =>{
    try{
        // get ID - assuming that we are sending ID in parameters
        const {sectionId} = req.body
        // const {sectionId} = req.body

        // use findByIdAndDelete
        await Section.findByIdAndDelete(sectionId);
        
        // TODO : Do we need to delete the entry from the course schema ??
        
        // return response
        return res.status(200).json({
            success:true,
            message:"Section Deleted"
        })
    }
    catch(error){
        console.error("Error deleting section:", error);
        return res.status(500).json({
            success:false,
            message:"Unable to create Section,please try again",
        })
    }
}

// exports.deleteSection = async (req, res) => {
// 	try {
// 		const { sectionId } = req.params;

// 		// 1. Find and delete the section
// 		const deletedSection = await Section.findByIdAndDelete(sectionId);
// 		if (!deletedSection) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "Section not found",
// 			});
// 		}

// 		// 2. Remove section reference from Course
// 		await Course.findByIdAndUpdate(
// 			deletedSection.course, // assuming section has a `course` field
// 			{ $pull: { courseContent: sectionId } }
// 		);

// 		return res.status(200).json({
// 			success: true,
// 			message: "Section deleted and course updated successfully",
// 		});
// 	} catch (error) {
// 		console.error("Error deleting section:", error);
// 		return res.status(500).json({
// 			success: false,
// 			message: "Unable to delete section, please try again",
// 		});
// 	}
// };
