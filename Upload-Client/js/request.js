/* 
	基于文件上传的多种场景和方案
	对axios库进行二次封装
	
	目的：对发送请求的公共配置部分进行抽取，减少冗余代码
	
	1. 公共请求URL baseUrl 
	2. 公共请求头 headers 
	3. 只针对post请求时携带的请求主体的格式转化 transformRequest 
		将json对象转化为xxx=111&yyy=222的格式
	4. 设置超时时间
	5. 设置跨域的时候是否可以携带凭证 withCredentials 
	6. 返回数据进行修改 transformResponse
	7. 返回头 responseType 状态码进行二次修改
	8. 取消请求 cancelToken 如何用呢？
	
	
	大型项目中很多需求：
	1. 增删改查业务 就普通的就好了
	2. 不要污染全局配置
	3. 针对上传的业务进行axios封装
 */

const uploadInstance = axios.create();

uploadInstance.defaults.baseURL = "http://127.0.0.1:8888";
uploadInstance.defaults.headers['Content-Type']='multipart/form-data';
uploadInstance.defaults.transformRequest = (data,headers)=>{
	const contentType = headers['Content-Type'];
	/* 
		对于application/x-www-form-urlencoded格式的请求，
		需要将data中的json对象转化为name=lilei&age=18字符串
	 */
	if(contentType === "application/x-www-form-urlencoded"){
		return Qs.stringify(data);
	}
	
	return data;
};

/* 
	设置响应拦截器
 */
uploadInstance.interceptors.response.use((res)=>{
	return res.data;
},(err)=>{
	/* 弹出上传失败的message */
	return Promise.reject(err);
})



