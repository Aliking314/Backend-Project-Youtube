const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
      Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export default asyncHandler;



// const asyncHandler = (func)=>(req,res,next)=>{
//     try {
        
//     } catch (error) {
//         res.statusCode(error.code||500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }