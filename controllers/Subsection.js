const SubSection = require("../models/SubSection")
const Section = require("../models/Section")
const {uploadImageToCloudinary} = require("../utils/imageUploader")

// Create a new sub-section for a given section
exports.createSubSection = async(req,res) =>{
    try{
        // fetch data from Req body
        const {sectionId,title,timeDuration,description}=req.body
        // extract file/video
        const video = req.files.videoFile;
        // validation
        if(!sectionId || !title || !timeDuration || !description || !video){
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            })
        }
        // Upload the video file to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME);
        // Create a new sub-section with the necessary information
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url,
        })
        // update section with this sub section ObjectId
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
                                                                {
                                                                    $push:{
                                                                        subSection:subSectionDetails._id,
                                                                    }
                                                                },{new:true} // The returned data should be updated
        ).populate("subSection");
        // HW : log updated section here, after adding populate query
        console.log("Updated Section:", updatedSection);
        // return response
        return res.status(200).json({
            success:true,
            message:"Sub Section Created Successfully",
            data: updatedSection,
        })
    }
    catch(error){
        console.error("Error creating new sub-section:", error)
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:error.message
        })
    }
}

// HW : updateSubSection

// HW : deleteSubSection

exports.updateSubSection = async (req, res) => {
    try {
      const { sectionId, title, description } = req.body
      const subSection = await SubSection.findById(sectionId)
  
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
      }
  
      await subSection.save()
  
      return res.json({
        success: true,
        message: "Section updated successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
}
  
exports.deleteSubSection = async (req, res) => {
    try {
      const { subSectionId, sectionId } = req.body
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        {
          $pull: {
            subSection: subSectionId,
          },
        }
      )
      const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
  
      if (!subSection) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }
  
      return res.json({
        success: true,
        message: "SubSection deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
}