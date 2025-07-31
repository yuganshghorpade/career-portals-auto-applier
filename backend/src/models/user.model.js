import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema({
    name:{
        type:String,
    },
    url:{
        type:String,
    },
    keywords:{
        type:String,
    },
    body:{
        type:String,
    },
    localpath:{
        type:String,
    }
},
{timestamps:true})

export const Resumedata = mongoose.model('Resumedata',resumeSchema)