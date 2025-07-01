<template>
  <div class="drawing">
    <p>场站图纸</p>
    <div class="drawing-svg">
      <svg ref=svgImageRef class="image-svg"></svg>
      <svg ref=svgMiniRef class="mini-svg"></svg>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { ref, watch } from 'vue';
import { zoom } from 'd3-zoom';
import { useStore } from 'vuex';
import { reqMergeImage } from "@/api"

export default {
  props: {
    filePath: {
      type: String,
      required: true
    }
  },
  setup() {
    const myStore = useStore()
    
    const DEFAULT_IMAGE_SVG_SIZE = { width: 270, height: 270 };
    const DEFAULT_MINI_SVG_SIZE = { width: 250, height: 200 };
    const svgImageRef = ref(null);
    const svgMiniRef = ref(null);

    const newImageUrl = ref("");

    const loadData = async (newValue) => {
      const imagePath = newValue.Y_path;
      const width = 1024;
      const height = 1024;
      const miniViewBox = {
        top_left_x: Number(newValue.Y_related.x1),
        top_left_y: Number(newValue.Y_related.y1),
        width: Number(newValue.Y_related.x2) - Number(newValue.Y_related.x1),
        height: Number(newValue.Y_related.y2) - Number(newValue.Y_related.y1)
      }
      newImageUrl.value = await reqMergeImage(myStore.state.mergeDisplay.areaName, imagePath);

      d3.select(svgImageRef.value).selectAll("*").remove();
      d3.select(svgMiniRef.value).selectAll("*").remove();

      drawOriginSVG(width, height, miniViewBox, DEFAULT_IMAGE_SVG_SIZE, svgImageRef, "imageView", true);
      drawSVG(width, height, miniViewBox, DEFAULT_MINI_SVG_SIZE, svgMiniRef, "miniView", false);
    };


    const drawOriginSVG = (imageWidth, imageHeight, viewBox, curSVGSize, svgRef, svgID) => {
      // 图像原始尺寸
      const imageSize = { width: imageWidth, height: imageHeight };
      // 裁剪区域
      const croppedScope = { x: viewBox.top_left_x, y: viewBox.top_left_y, width: viewBox.width, height: viewBox.height };
      // SVG显示区域尺寸
      const svgSize = curSVGSize;

      // 用于计算当前图像在SVG中的显示区域
      let imageInScopeX, imageInScopeY, imageInScopeW, imageInScopeH;
      // 用于定义裁剪区域
      let clipX, clipY, clipW, clipH;

      const svgLen = d3.select(svgRef.value)
        .attr("width", svgSize.width)
        .attr("height", svgSize.height);

      // 清空SVG内容
      svgLen.selectAll("*").remove();

      // 创建外层g元素
      const outerGroup = svgLen.append('g').attr('id', `outerGroup${svgID}`); // 新增外层 g

      // 内部的 g 元素 (现有的 g)
      const innerGroup = outerGroup.append('g').attr('id', `innerGroup${svgID}`); // 设置 ID 为 innerGroup${svgID}}

      const scale = calculateScale(imageSize, svgSize); // 按宽度或高度缩放，介于0-1之间

      // 根据缩放比例计算图像显示属性，返回图像在SVG中的显示区域(左上x,左上y,w,h)，此时图像在SVG中居中
      ({ X: imageInScopeX, Y: imageInScopeY, W: imageInScopeW, H: imageInScopeH } = calculateImageAttributes(scale, imageSize, svgSize));
      // 返回裁剪区域在SVG中的显示区域(左上x,左上y,w,h)，此时裁剪部分在SVG中居中
      ({ X: clipX, Y: clipY, W: clipW, H: clipH } = calculateClipAttributes(imageInScopeX, imageInScopeY, imageInScopeW, imageInScopeH, croppedScope, imageSize));

      addImageElement(innerGroup, imageInScopeX, imageInScopeY, imageInScopeW, imageInScopeH, svgID); // 修改为使用 innerGroup

      addRedBorderRect(innerGroup, clipX, clipY, clipW, clipH, svgID); // 修改为使用 innerGroup

      // 添加缩放事件监听器
      const zoomBehavior = zoom()
        .scaleExtent([0.5, 5]) // 设置缩放范围
        .on('zoom', (event) => {
          outerGroup.attr('transform', event.transform); // 应用缩放变换
        });

      svgLen.call(zoomBehavior); // 将缩放行为应用到SVG元素

    };

    const drawSVG = (imageWidth, imageHeight, viewBox, curSVGSize, svgRef, svgID) => {
      // 图像原始尺寸
      const imageSize = { width: imageWidth, height: imageHeight };
      // 裁剪区域
      const croppedScope = { x: viewBox.top_left_x, y: viewBox.top_left_y, width: viewBox.width, height: viewBox.height };
      // SVG显示区域尺寸
      const svgSize = curSVGSize;

      // 用于计算当前图像在SVG中的显示区域
      let imageInScopeX, imageInScopeY, imageInScopeW, imageInScopeH;
      // 用于定义裁剪区域
      let clipX, clipY, clipW, clipH;

      const svgLen = d3.select(svgRef.value)
        .attr("width", svgSize.width)
        .attr("height", svgSize.height);

      // 清空SVG内容
      svgLen.selectAll("*").remove();

      // 创建外层g元素
      const outerGroup = svgLen.append('g').attr('id', `outerGroup${svgID}`); // 新增外层 g

      // 内部的 g 元素 (现有的 g)
      const innerGroup = outerGroup.append('g').attr('id', `innerGroup${svgID}`); // 设置 ID 为 innerGroup${svgID}}

      const scale = calculateScale(imageSize, svgSize); // 按宽度或高度缩放，介于0-1之间

      // 根据缩放比例计算图像显示属性，返回图像在SVG中的显示区域(左上x,左上y,w,h)，此时图像在SVG中居中
      ({ X: imageInScopeX, Y: imageInScopeY, W: imageInScopeW, H: imageInScopeH } = calculateImageAttributes(scale, imageSize, svgSize));
      // 返回裁剪区域在SVG中的显示区域(左上x,左上y,w,h)
      ({ X: clipX, Y: clipY, W: clipW, H: clipH } = calculateClipAttributes(imageInScopeX, imageInScopeY, imageInScopeW, imageInScopeH, croppedScope, imageSize));

      addImageElement(innerGroup, imageInScopeX, imageInScopeY, imageInScopeW, imageInScopeH, svgID); // 修改为使用 innerGroup

      addClipPath(innerGroup, clipX, clipY, clipW, clipH, svgID); // 修改为使用 innerGroup

      applyTransformations(innerGroup, clipX, clipY, clipW, clipH, svgSize); // 修改为使用 innerGroup

      // 添加缩放事件监听器
      const zoomBehavior = zoom()
        .scaleExtent([0.5, 5]) // 设置缩放范围
        .on('zoom', (event) => {
          outerGroup.attr('transform', event.transform); // 应用缩放变换
        });

      svgLen.call(zoomBehavior); // 将缩放行为应用到SVG元素
    };

    // 计算缩放比例：若图片宽高比大，则按宽度缩放；若图片宽高比小，则按高度缩放
    const calculateScale = (imageSize, svgSize) => {
      const imageW2H = imageSize.width / imageSize.height;
      const svgW2H = svgSize.width / svgSize.height;

      return imageW2H > svgW2H
        ? svgSize.width / imageSize.width
        : svgSize.height / imageSize.height;
    };

    // 根据缩放比例计算图像显示属性，返回图像在SVG中的显示区域(左上x,左上y,w,h)，此时图像在SVG中居中
    const calculateImageAttributes = (scale, imageSize, svgSize) => {
      const W = imageSize.width * scale; // 原图在SVG中的宽度
      const H = imageSize.height * scale; // 原图在SVG中的高度
      const X = (svgSize.width - W) / 2;
      const Y = (svgSize.height - H) / 2;
      return { X, Y, W, H };
    };

    // 计算裁剪区域属性
    const calculateClipAttributes = (imageInScopeX, imageInScopeY, imageInScopeW, imageInScopeH, croppedScope, imageSize) => {
      const X = imageInScopeX + (croppedScope.x / imageSize.width) * imageInScopeW;
      const Y = imageInScopeY + (croppedScope.y / imageSize.height) * imageInScopeH;
      const W = (croppedScope.width / imageSize.width) * imageInScopeW;
      const H = (croppedScope.height / imageSize.height) * imageInScopeH;

      return { X, Y, W, H };
    };

    // 添加图像元素
    const addImageElement = (g, imageInScopeX, imageInScopeY, imageInScopeW, imageInScopeH, svgID) => {
      g.append('image')
        .attr('href', newImageUrl.value)
        .attr('x', imageInScopeX)
        .attr('y', imageInScopeY)
        .attr('width', imageInScopeW)
        .attr('height', imageInScopeH)
        .attr('clip-path', `url(#clip${svgID})`);
    };

    // 添加裁剪路径
    const addClipPath = (g, clipX, clipY, clipW, clipH, svgID) => {
      g.append('defs').append('clipPath')
        .attr('id', `clip${svgID}`)
        .append('rect')
        .attr('x', clipX)
        .attr('y', clipY)
        .attr('width', clipW)
        .attr('height', clipH);
    };

    // 添加红色边框的矩形
    const addRedBorderRect = (g, clipX, clipY, clipW, clipH, svgID) => {
      g.append('rect')
        .attr('x', clipX)
        .attr('y', clipY)
        .attr('width', clipW)
        .attr('height', clipH)
        .style('fill', 'none') // 设置填充为无
        .style('stroke', 'red') // 设置边框颜色为红色
        .style('stroke-width', 2); // 可以根据需要调整边框宽度
    };


    // 应用缩放和平移变换
    const applyTransformations = (g, clipX, clipY, clipW, clipH, svgSize) => {
      const zoomScaleWidth = svgSize.width / clipW;
      const zoomScaleHeight = svgSize.height / clipH;

      const zoomScale = Math.min(zoomScaleWidth, zoomScaleHeight);
      const translateX = -clipX + (svgSize.width - clipW * zoomScale) / 2 / zoomScale;
      const translateY = -clipY + (svgSize.height - clipH * zoomScale) / 2 / zoomScale;

      g.attr("transform", `scale(${zoomScale}) translate(${translateX}, ${translateY})`);
    };

    // 监视 props.filePath 的变化
    watch(() => myStore.state.mergeDisplay.matchSelectedConnection, (newValue) => {
      if (Object.keys(newValue).length > 0) {
        loadData(newValue);
      }
    });

    return {
      svgImageRef,
      svgMiniRef,
    };
  }
};
</script>

<style>
.drawing {
  width: 100%;
  height: calc(50% - 10px);
  margin-bottom: 20px;
  background-color: #141414;
  /* 白色背景 */
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  /* 添加阴影效果以提升可区分性 */
}

.drawing-svg {
  display: flex;
  flex-direction: row;
}

p {
  font-family: 'PT Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 20.7px;
  text-align: left;
  color: rgba(255, 255, 255, 0.85);
  /* 深色文字，确保在浅色背景上可读性 */
  padding-left: 15px;
  /* padding-top: 15px; */
}

.image-svg {
  margin-left: 20px;
}

.mini-svg {
  margin-left: 75px;
  margin-top: 25px;
}
</style>