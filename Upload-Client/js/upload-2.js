(function(){
	/**
	 * 基于BASE64实现单一文件的上传
	 */
	let upload = document.querySelector('#upload-2'),
		upload_inp = upload.querySelector('.upload_inp'),
		upload_button_select = upload.querySelector('.upload_button.select');
	
	/* 验证按钮是否处于可操作状态 */
	const checkIsDisabled = (element)=>{
		let classList = element.classList;
		return classList.contains('disable') || classList.contains('loading');
	}
	
	/* 将文件对象转化为base64 */
	const readBASE64 = (file)=>{
		return new Promise((resolve,reject)=>{
			let fileReader = new FileReader();
			fileReader.readAsDataURL(file);
			fileReader.onload = function(e){
				resolve(e.target.result);
			}
		})
	}
	
	/* 模拟原生input事件点击 唤起文件选择框 */
	upload_button_select.addEventListener('click', () => {
		/* 如果当前正在上传 那么点击此按钮无效 */
		if (checkIsDisabled(upload_button_select)) return;
		upload_inp.click();
	})
	
	/* 监听原生input选择文件的change事件 */
	upload_inp.addEventListener('change', async function(){
		console.log('upload_inp', upload_inp.files)
		let file = upload_inp.files[0];
		if (!file) return;
	
		const {
			type,
			size,
			name
		} = file;
	
		/* 限制选择文件的类型 */
		if (!/(PNG|JPEG|JPG)/i.test(type)) {
			alert("所选文件类型只能是PNG|JPEG|JPG类型");
			return;
		}
	
		/* 限制选择文件的大小 */
		const MAX_SIZE = 2 * 1024 * 1024;
		if (size > MAX_SIZE) {
			alert("所选文件大小不能超出2MB");
			return;
		}
		
		/* 开始上传 设置loading防止重复点击 */
		upload_button_select.classList.add('loading');
		
		/* 基于fileReader将文件对象转化为base64字符串 */
		let BASE64 = await readBASE64(file);
		console.log(BASE64)
		/* 发起请求 */
		try{
			let data = await uploadInstance.post("/upload_single_base64",{
				file:encodeURIComponent(BASE64),
				filename:name
			},{
				headers:{
					'Content-Type':'application/x-www-form-urlencoded'
				}
			})
			console.log(data)
			if(+data.code === 0){
				alert(`文件上传成功！,查看文件地址访问资源：${data.servicePath}`);
				return;
			}
			// 失败则进去catch中统一处理
			throw new Error(data.codeText);
		}catch(e){
			alert(`文件上传失败！`);
		}finally{
			upload_button_select.classList.remove('loading');
			/* 为了防止选择相同文件不触发change事件 需要将input的value移除 */
			upload_inp.value = "";
		}
	
		
	})
})();