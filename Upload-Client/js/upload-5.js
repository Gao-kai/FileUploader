(function () {
  /* 获取dom元素对象 */
  let upload_box = document.querySelector("#upload-5");
  let upload_inp = upload_box.querySelector(".upload_inp");
  let upload_button_select = upload_box.querySelector(".upload_button.select");
  let upload_button_upload = upload_box.querySelector(".upload_button.upload");
  let upload_list = upload_box.querySelector(".upload_list");
  let selectFiles;

  /* 
    工具方法：创建一个唯一的key值
  */
  function createRandom() {
    let random = Math.random() * Date.now();
    return random.toString(16).replace(".", "");
  }

  /* 
    工具方法：判断一个dom元素是否处于loading或者disbale状态
  */
  function isDisable(el){
    return el.classList.contains('loading') || el.classList.contains('disable');
  }

  /* 监听选择文件点击事件 触发原生input框的change事件 */
  upload_button_select.addEventListener("click", function () {
    if(isDisable(this)) return;
    upload_inp.click();
  });

  /* 监听input框的change事件获取files列表 */
  upload_inp.addEventListener("change", (e) => {
    let files = Array.from(upload_inp.files);
    console.log("files", files);
    if (files.length === 0) return;

    /* 重构files集合 给每一个files注入一个key唯一值 便于后续移除、定位等 */
    files = files.map((file) => {
      return {
        file,
        filename: file.name,
        key: createRandom(),
      };
    });

    /* 视图列表中依次注入 */
    let str = ``;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      str += `<li key="${file.key}">
        <span>文件${i + 1}：${file.filename}</span>
        <span><em>移除</em></span>
    </li>`;
    }
    upload_list.innerHTML = str;
    upload_list.style.display = "block";
    // 赋值给全局变量
    selectFiles = files;
  });

  /* 通过事件委托机制 实现点击移除按钮 视图和file的双重移除 */
  upload_list.addEventListener("click", function (e) {
    let source = e.target;
    console.dir(source);
    if (source.tagName === "EM") {
      // 获取这个source元素是那个li标签的 定位出要移除的li标签
      let currRemoveLi = source.parentNode.parentNode;
      // 基于currLi元素对象中的attr获取到key对应的值，定位出要移除的files对象
      if (currRemoveLi) {
        // 视图移除
        upload_list.removeChild(currRemoveLi);

        // 逻辑移除
        let key = currRemoveLi.getAttribute("key");
        selectFiles = selectFiles.filter((file) => file.key !== key);

        // 如果移除完了 就不展示列表了
        if (selectFiles.length === 0) {
          upload_list.style.display = "none";
        }
      }
    }
  });

  /* 
    监听上传到服务器按钮点击 开始上传
    1. 按钮防抖实现
    2. 不管上传结果如何 都要清空列表
    3. promsie管理 async管理
    4. form-data传递
    5. Promise.all进行管理
  */
  upload_button_upload.addEventListener("click", function () {
    if(isDisable(this)) return;

    if(selectFiles.length===0){
        alert("请先选择文件后上传");
        return;
    }

    // 获取列表dom中的所有li集合
    let uploadListLis = Array.from(upload_list.querySelectorAll('li'));

    // 点击之后按钮分别为disable和loading
    upload_button_select.classList.add('disable');
    upload_button_upload.classList.add('loading');

    // 构建多个请求promsie
    selectFiles = selectFiles.map(item=>{
        // 构建请求体
        const {file,filename} = item;
        let formData = new FormData();
        formData.append('file',file);
        formData.append('filename',filename);

        // 获取每个请求对应的span元素 便于用进度百分比展示
        let currLi = uploadListLis.find(li=>li.getAttribute('key') === item.key);
        let currSpan = currLi ? currLi.querySelectorAll('span')[1]:null;
        console.log(currLi,currSpan);

        // 返回一个全新的promsie
        return uploadInstance.post("/upload_single",formData,{
            // 监听每一个的上传进度
            onUploadProgress:function(e){
                let progress = ((e.loaded / e.total) * 100).toFixed(2);
                console.log(progress);
                if(currSpan){
                    currSpan.innerHTML = progress + '%';
                }
                
            }
        }).then(res=>{
            if(+res.code===0){
                if(currSpan){
                    currSpan.innerHTML = '100%';
                }
                return;
            }
            // 如果业务失败
            return Promise.reject(res.codeText);
        })
    })

    console.log(selectFiles);

    // 等待所有上传结束
    Promise.all(selectFiles).then(res=>{
        // alert('所有文件上传成功');
    }).catch(err=>{
        alert('文件上传失败');
    }).finally(()=>{
        // 结束之后按钮恢复
        upload_button_select.classList.remove('disable');
        upload_button_upload.classList.remove('loading');
        // 列表清空
        // upload_list.style.display = "none";
        // upload_list.innerHTML = "";
    })

  });
})();
