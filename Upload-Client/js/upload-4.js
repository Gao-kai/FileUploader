(function () {
  /* 
        延迟函数
    */

  function delay(interval) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, interval);
    });
  }

  function delay1(interval) {
    let start = Date.now();
    while (Date.now() - start <= interval) {
      continue;
    }
  }

  /* 获取dom元素 */
  let upload_box = document.querySelector("#upload-4");
  let upload_button_select = upload_box.querySelector(".upload_button.select");
  let upload_inp = upload_box.querySelector(".upload_inp");
  let upload_progress = upload_box.querySelector(".upload_progress");
  let upload_progress_value = upload_progress.querySelector(".value");

  /* 验证按钮是否处于disabled状态 */
  const checkIsDisabled = (element) => {
    let classList = element.classList;
    return classList.contains("disable") || classList.contains("loading");
  };

  /* 模拟原生input事件点击 唤起文件选择框 */
  upload_button_select.addEventListener("click", () => {
    /* 如果当前正在上传 那么点击此按钮无效 */
    if (checkIsDisabled(upload_button_select)) return;
    upload_inp.click();
  });

  /* 监听原生input选择文件的change事件 */
  upload_inp.addEventListener("change", async function () {
    let file = upload_inp.files[0];
    if (!file) return;

    const { type, size, name } = file;

    /* 限制选择文件的类型 */
    // if (!/(PNG|JPEG|JPG)/i.test(type)) {
    //   alert("所选文件类型只能是PNG|JPEG|JPG类型");
    //   return;
    // }

    /* 限制选择文件的大小 */
    const MAX_SIZE = 100 * 1024 * 1024;
    if (size > MAX_SIZE) {
      alert("所选文件大小不能超出2MB");
      return;
    }

    /* 开始上传 设置loading防止重复点击 */
    upload_button_select.classList.add("loading");

    try {
      /* 封装form-data数据体 */
      const formData = new FormData();
      formData.append("file", file);
      formData.append("filename", name);

      const data = await uploadInstance.post("/upload_single", formData, {
        onUploadProgress: (e) => {
          console.log(e);
          const { loaded, total } = e;
          /* 展示进度条盒子 */
          upload_progress.style.display = "block";
          upload_progress_value.style.width = `${(loaded / total) * 100}%`;
        },
      });

      console.log(data);
      if (+data.code === 0) {
        upload_progress_value.style.width = `100%`;
        // 延迟500ms再触发alert防止中止页面渲染
        await delay(500);
        alert(`文件上传成功！,查看文件地址访问资源：${data.servicePath}`);
        return;
      }
      throw data.codeText;
    } catch (error) {
      alert(`文件上传失败！`);
    } finally {
      // 隐藏进度条
      upload_button_select.classList.remove("loading");
      upload_progress.style.display = "none";
      upload_progress_value.style.width = `0%`;

      /* 为了防止选择相同文件不触发change事件 需要将input的value移除 */
      upload_inp.value = "";
    }
  });
})();
