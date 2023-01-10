(function() {
	/**
	 * 基于Form-Data实现单一文件的上传
	 */
	let upload = document.querySelector('#upload-1'),
		upload_inp = upload.querySelector('.upload_inp'),
		upload_button_select = upload.querySelector('.upload_button.select'),
		upload_button_upload = upload.querySelector('.upload_button.upload'),
		upload_tip = upload.querySelector('.upload_tip'),
		upload_list = upload.querySelector('.upload_list');

	let selectFile = null;

	/* 列表移除 */
	const clearHanlder = () => {
		selectFile = null;
		// 样式处理
		upload_tip.style.display = 'block';
		upload_list.style.display = 'none';
		upload_list.innerHTML = ``;
	}

	/* 模拟原生input事件点击 唤起文件选择框 */
	upload_button_select.addEventListener('click', () => {
		/* 如果当前正在上传 那么点击此按钮无效 */
		if (upload_button_select.classList.contains('disable') || upload_button_upload.classList.contains(
				'loading')) return;

		upload_inp.click();
	})

	/* 监听已选择文件的移除事件 基于事件冒泡 让列表框消失 tips展示 清空列表 */
	upload_list.addEventListener('click', (e) => {
		let sourceEl = e.target;
		if (sourceEl.tagName === "EM") {
			console.log('点击了移除按钮，事件源为', sourceEl);
			clearHanlder();
		}
	})

	/* 监听原生input选择文件的change事件 */
	upload_inp.addEventListener('change', () => {
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

		/* 选中文件之后提示语消失，列表展示并将列表项动态插入 */
		upload_tip.style.display = 'none';
		upload_list.style.display = 'block';
		upload_list.innerHTML = `<li>
		    <span>文件：${name}</span>
		    <span><em>移除</em></span>
		</li>`;

		/* 为了防止选择相同文件不触发change事件 需要将input的value移除 */
		upload_inp.value = "";
	})

	/* 监听上传文件到服务器按钮 发起网络请求进行上传 */
	upload_button_upload.addEventListener('click', () => {
		/* 如果当前正在上传 那么点击此按钮无效 */
		if (upload_button_select.classList.contains('disable') || upload_button_upload.classList.contains(
				'loading')) return;

		console.log(selectFile)
		if (!selectFile) {
			alert("请先选择要上传的文件");
			return;
		}

		/* 点击上传按钮之后 选择按钮置灰 上传按钮展示loading */
		upload_button_select.classList.add('disable');
		upload_button_upload.classList.add('loading');

		/* 封装form-data数据体 */
		const formData = new FormData();
		formData.append('file', selectFile);
		formData.append('filename', selectFile.name)

		/* 发起请求 */
		uploadInstance.post("/upload_single", formData).then(data => {
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
		})
	})
})()
