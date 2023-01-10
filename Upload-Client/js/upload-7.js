/* 
    大文件上传
    1. 切片上传
    2. 断点续传

    首先将文件按照自己的设定进行切片，切片的思路是：
    1. 固定大小，规定每一个片的size固定为多少kb，然后计算要切多少片
    2. 固定数量，规定就切count个片，每一片的size是固定的

    将两者综合起来：
    1. 先固定大小，假设每一个片为1mb，切ceil个片
    2. 如果count小于等于100个，那么就发起请求依次传输
    3. 如果count大于100个，就固定最多切100个固定数量，然后计算每一片的大小
*/
(function () {
  /* 
        获取dom元素
    */
  let upload = document.querySelector("#upload-7"),
    upload_inp = upload.querySelector(".upload_inp"),
    upload_button_select = upload.querySelector(".upload_button.select"),
    upload_progress = upload.querySelector(".upload_progress"),
    upload_progress_value = upload_progress.querySelector(".value");

  const checkIsDisable = (element) => {
    let classList = element.classList;
    return classList.contains("disable") || classList.contains("loading");
  };

  /* 获取文件hash值 */
  function getFileHash(file){
    return new Promise((resolve,reject)=>{
        let fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = function(e){
            let buffer = e.target.result;
            let spark = new SparkMD5.ArrayBuffer();
            spark.append(buffer);
            let HASH = spark.end();
            let suffix = /\.([a-zA-Z0-9]+)$/.exec(file.name)[1];
            resolve({
                buffer,
                HASH,
                suffix,
                filename:`${HASH}.${suffix}`
            })
        }
        
    })
  }


  upload_button_select.addEventListener("click", function () {
    if (checkIsDisable(this)) return;
    upload_inp.click();
  });

  /* 切片上传 */
  upload_inp.addEventListener('change',async function(e){
    let file = upload_inp.files[0];
    if(!file) return;

    upload_button_select.classList.add('loading');
    upload_progress.style.display = 'block';

    // 获取文件的Hash值 当做每一个分片的前缀
    let {HASH,suffix} = await getFileHash(file);
    let data;
    let uploadedChunkList = []; // 已上传Hash的切片名称

    // 首先查询已经上传的切片信息
    try {
        data = await uploadInstance.get('/upload_already',{
            params:{
                HASH
            }
        })

        // 读取已上传的列表
        if (+data.code === 0) {
            uploadedChunkList = data.fileList;
        }
    } catch (error) {
        console.error(error);
    }

    // 文件进行切片 先固定大小 后固定数量
    let size = 1024 * 100; // 固定每一片1MB
    let count = Math.ceil(file.size / size); // 要切多少个
    let chunks = []; // 存放所有的分片

    if(count > 100){
        size = file.size / 100;
        count = 100;
    }

    // 将文件进行分片slice 重新定义每一片的名称如HASH-1.zip HASH-2.zip
    for (let i = 0; i < count; i++) {
        // 切割后放入chunks中 file = > 原型上有blob => blob.slice方法 实现切割
        chunks.push({
            file:file.slice(i*size,(i+1)*size),
            filename:`${HASH}_${i+1}.${suffix}`
        })
    }


    let counter = 0; // 计数器 每一个切片成功上传之后计数器+1 +到等于count的时候停止上传 计算进度条
    // 每一个切片都进行上传
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // 已经上传过的分片不会重新上传 只让counter计数器++
        if(uploadedChunkList.length && uploadedChunkList.includes(chunk.filename)){
            complete();
            continue;
        }

        let fm = new FormData();
        fm.append('file', chunk.file);
        fm.append('filename', chunk.filename);

        // 同步发起多个请求将切片进行上传
        uploadInstance.post('/upload_chunk', fm).then(data => {
            if (+data.code === 0) {
                complete();
                return;
            }
            return Promise.reject(data.codeText);
        }).catch((err) => {
            console.log('当前切片上传失败，请您稍后再试~~',err);
            upload_button_select.classList.remove('loading');
            upload_progress.style.display = 'none';
            upload_progress_value.style.width = '0%';
        })
        
    }


    /* 计算是否完成所有切片上传 */
   
    async function complete(){
        counter++;

        // 实时展示进度条
        console.log('进度为',counter / count);
        upload_progress_value.style.width = `${counter / count * 100}%`;
        if(counter < count) return;

        /* 
            代码走到这里 说明counter等于count了 所有切片都传完了 都返回了正常的结果 
            这时候需要告诉服务器进行分片合并merge操作
        */
        upload_progress_value.style.width = `100%`;
        
        try {
            data = await uploadInstance.post('/upload_merge', {
                HASH,
                count
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            if (+data.code === 0) {
                console.log(`恭喜您，文件上传成功，您可以基于 ${data.servicePath} 访问该文件~~`);
                return;
            }
            throw data.codeText;
        } catch (err) {
            alert('切片合并失败，请您稍后再试~~');
        } finally {
            upload_button_select.classList.remove('loading');
            upload_progress.style.display = 'none';
            upload_progress_value.style.width = '0%';
        }
    }
  })

})();
