(function() {
	/**
	 * 基于Form-Data实现单一文件的上传
	 */
	let upload = document.querySelector('#upload-3'),
		upload_inp = upload.querySelector('.upload_inp'),
		upload_button_select = upload.querySelector('.upload_button.select'),
		upload_button_upload = upload.querySelector('.upload_button.upload'),
		upload_abbre = upload.querySelector('.upload_abbre'),
		upload_abbre_img = upload.querySelector('img');

	let selectFile = null;

	/* 列表移除 */
	const clearHanlder = () => {
		selectFile = null;
		// 样式处理
		upload_abbre.style.display = 'block';
		upload_abbre_img.src = "";
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
	
	
	/* 将文件对象转化为ArrayBuffer */
	const readArrayBuffer = (file)=>{
		return new Promise((resolve,reject)=>{
			let fileReader = new FileReader();
			fileReader.readAsArrayBuffer(file);
			fileReader.onload = function(e){
				let buffer = e.target.result;
				let spark = new SparkMD5.ArrayBuffer();
				spark.append(buffer)
				
				let Hash = spark.end();
				let suffix = /\.([a-zA-Z0-9]+)$/.exec(file.name)[1];
				
				resolve({
					buffer,
					Hash,
					suffix,
					filename:`${Hash}.${suffix}`
				})
			}
		})
	}

	/* 模拟原生input事件点击 唤起文件选择框 */
	upload_button_select.addEventListener('click', () => {
		/* 如果当前正在上传 那么点击此按钮无效 */
		if (upload_button_select.classList.contains('disable') || upload_button_upload.classList.contains(
				'loading')) return;

		upload_inp.click();
	})

	/* 监听原生input选择文件的change事件 */
	upload_inp.addEventListener('change', async () => {
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

		/* 存入全局变量 */
		selectFile = file;
		 
		 
		let BASE64 = await readBASE64(selectFile);

		/* 选中文件之后展示缩略图 */
		upload_button_select.classList.add('disable');
		upload_abbre.style.display = 'block';
		upload_abbre_img.src = BASE64;
		upload_button_select.classList.remove('disable');

		/* 为了防止选择相同文件不触发change事件 需要将input的value移除 */
		upload_inp.value = "";
	})

	/* 监听上传文件到服务器按钮 发起网络请求进行上传 */
	upload_button_upload.addEventListener('click', async () => {
		/* 如果当前正在上传 那么点击此按钮无效 */
		if (upload_button_select.classList.contains('disable') || upload_button_upload.classList.contains('loading')) return;
		if (!selectFile) {
			alert("请先选择要上传的文件");
			return;
		}

		/* 点击上传按钮之后 选择按钮置灰 上传按钮展示loading */
		upload_button_select.classList.add('disable');
		upload_button_upload.classList.add('loading');

		/* 封装form-data数据体 */
		const formData = new FormData();
		const {filename} = await readArrayBuffer(selectFile);
		console.log('filename',filename)
		formData.append('file', selectFile);
		formData.append('filename', filename)

		/* 发起请求 */
		uploadInstance.post("/upload_single_name", formData).then(data => {
			if (+data.code === 0) {
				alert(`文件上传成功！,查看文件地址访问资源：${data.servicePath}`);
				return;
			}
			// 业务状态码不为0 也说明是业务层面的失败 直接透传下去统一到第二个catch中接收
			return Promise.reject(data.codeText);
		}).catch(err => {
			// 可以上报失败信息到日志系统
			alert(`文件上传失败！`);
		}).finally(() => {
			// 无论成功还是失败 列表都需要清空让用户重选 并且按钮的状态也会变化
			clearHanlder();
			upload_button_select.classList.remove('disable');
			upload_button_upload.classList.remove('loading');
			upload_abbre.style.display = 'none';
			upload_abbre_img.src = "";
		})
	})
})()
