(function () {
  /* 
        获取dom元素
    */
  let upload = document.querySelector("#upload-6"),
    upload_inp = upload.querySelector(".upload_inp"),
    upload_submit = upload.querySelector(".upload_submit"),
    upload_mark = upload.querySelector(".upload_mark");

  // 哨兵变量 防抖
  let isUploading = false;

  /* 监听一系列拖拽事件 */
  upload.addEventListener("dragenter", (e) => {
    console.log("进入区域");
  });

  upload.addEventListener("dragleave", (e) => {
    console.log("离开区域");
  });

  upload.addEventListener("dragover", (e) => {
    e.preventDefault();
    console.log("在区域中移动");
  });

  upload.addEventListener("drop", (e) => {
    e.preventDefault();
    console.log("放置到容器中", e);
    let file = e.dataTransfer.files[0];
    if (!file) return;
    // 开始上传
    uploadFile(file);
  });

  /* 上传 */
  async function uploadFile(file) {
    upload_mark.style.display = 'block';
    isUploading = true;
    try {
        let fm = new FormData();
        fm.append('file',file);
        fm.append('filename',file.name);
        const data = await uploadInstance.post("/upload_single",fm);
        if(+data.code === 0){
            alert('上传成功');
            return;
        }
        throw data.codeText;
    } catch (error) {
        alert('上传失败',error);
    } finally {
        upload_mark.style.display = 'none';
        isUploading = false;
    }
  }

  // 手动选择
  upload_inp.addEventListener("change", function () {
    let file = upload_inp.files[0];
    if (!file) return;
    uploadFile(file);
  });
  upload_submit.addEventListener("click", function () {
    upload_inp.click();
  });
})();
