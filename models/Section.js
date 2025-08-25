const mongoose=require("mongoose")

const sectionSchema= new mongoose.Schema({
    sectionName:{
        type:String
    },
    subSection:[
        {
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"SubSection"
        }
    ]
})

module.exports = new mongoose.model("Section",sectionSchema)