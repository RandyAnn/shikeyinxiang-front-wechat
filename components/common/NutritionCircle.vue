<template>
  <view class="nutrition-circle">
    <view class="circle-container">
      <!-- 使用canvas替代SVG -->
      <canvas 
        type="2d" 
        class="circle-canvas" 
        :id="canvasId" 
        :style="{ width: size + 'rpx', height: size + 'rpx' }"
        @touchend="redraw"
      ></canvas>
      <!-- 中心文字 -->
      <view class="content">
        <view class="percentage">
          <text class="percentage-value">{{ formattedPercentage }}</text>
          <text class="percentage-symbol">%</text>
        </view>
        <text class="label">{{ label }}</text>
        <view class="value-info">
          <text>{{ current | formatValue }}{{ unitText }}</text>
        </view>
      </view>
    </view>
    <view class="target-info">
      <text>目标: {{ target | formatValue }}{{ unitText }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'NutritionCircle',
  props: {
    percentage: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      default: 0
    },
    current: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: '#FF7043'
    },
    bgColor: {
      type: String,
      default: 'rgba(255, 255, 255, 0.25)'
    },
    label: {
      type: String,
      default: '热量'
    },
    size: {
      type: Number,
      default: 180
    },
    strokeWidth: {
      type: Number,
      default: 10
    }
  },
  data() {
    return {
      canvasId: 'nutrition-circle-' + Math.floor(Math.random() * 1000),
      canvasContext: null,
      pixelRatio: 1
    }
  },
  filters: {
    formatValue(value) {
      return Math.round(value || 0);
    }
  },
  computed: {
    formattedPercentage() {
      return Math.round(Math.min(this.percentage || 0, 100));
    },
    unitText() {
      if (this.label === '热量') return '';
      return 'g';
    }
  },
  watch: {
    percentage() {
      this.$nextTick(() => {
        this.drawCircle();
      });
    },
    size() {
      this.$nextTick(() => {
        this.initCanvas();
      });
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.initCanvas();
      }, 100); // 稍微延迟以确保DOM已渲染
    });
  },
  methods: {
    // 初始化canvas
    initCanvas() {
      const query = uni.createSelectorQuery().in(this);
      query.select('#' + this.canvasId)
        .fields({ node: true, size: true })
        .exec(res => {
          if (!res[0] || !res[0].node) {
            // 如果未获取到node，尝试使用传统方式
            this.initCanvasLegacy();
            return;
          }
          
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          this.pixelRatio = uni.getSystemInfoSync().pixelRatio;
          // 设置canvas实际大小
          canvas.width = this.size * this.pixelRatio;
          canvas.height = this.size * this.pixelRatio;
          
          // 缩放绘图操作，使其在高分屏上显示清晰
          ctx.scale(this.pixelRatio, this.pixelRatio);
          
          this.canvasContext = ctx;
          this.drawCircle();
        });
    },
    
    // 兼容低版本的初始化方法
    initCanvasLegacy() {
      const context = uni.createCanvasContext(this.canvasId, this);
      this.canvasContext = context;
      this.drawCircleLegacy();
    },
    
    // 绘制圆环 - 2d标准绘制
    drawCircle() {
      if (!this.canvasContext) return;
      
      const ctx = this.canvasContext;
      const centerX = this.size / 2;
      const centerY = this.size / 2;
      const radius = (this.size / 2) - (this.strokeWidth / 2);
      
      // 清空画布
      ctx.clearRect(0, 0, this.size, this.size);
      
      // 绘制内部填充圆形
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - this.strokeWidth/2, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fill();
      
      // 绘制背景圆环
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = this.bgColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.stroke();
      
      // 绘制进度圆环
      if (this.percentage > 0) {
        const progress = Math.min(this.percentage, 100) / 100;
        ctx.beginPath();
        // 从顶部开始绘制(-0.5π)，顺时针方向
        ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, (-0.5 + 2 * progress) * Math.PI);
        ctx.strokeStyle = this.color;
        ctx.lineCap = 'round';
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
        
        // 添加高光效果
        if (progress > 0.05) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, (-0.5 + 0.1) * Math.PI);
          const gradient = ctx.createLinearGradient(
            centerX, centerY - radius, 
            centerX, centerY - radius + this.strokeWidth
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = this.strokeWidth / 2;
          ctx.stroke();
        }
      }
      
      // 对于非传统canvas API，需要手动更新帧
      if (ctx.draw) {
        ctx.draw();
      }
    },
    
    // 传统canvas绘制方法
    drawCircleLegacy() {
      if (!this.canvasContext) return;
      
      const ctx = this.canvasContext;
      const centerX = this.size / 2;
      const centerY = this.size / 2;
      const radius = (this.size / 2) - (this.strokeWidth / 2);
      
      // 清空画布
      ctx.clearRect(0, 0, this.size, this.size);
      
      // 绘制内部填充圆形
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - this.strokeWidth/2, 0, 2 * Math.PI);
      ctx.setFillStyle('rgba(0, 0, 0, 0.15)');
      ctx.fill();
      
      // 绘制背景圆环
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.setStrokeStyle(this.bgColor);
      ctx.setLineWidth(this.strokeWidth);
      ctx.stroke();
      
      // 绘制进度圆环
      if (this.percentage > 0) {
        const progress = Math.min(this.percentage, 100) / 100;
        ctx.beginPath();
        // 从顶部开始绘制(-0.5π)，顺时针方向
        ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, (-0.5 + 2 * progress) * Math.PI);
        ctx.setStrokeStyle(this.color);
        ctx.setLineCap('round');
        ctx.setLineWidth(this.strokeWidth);
        ctx.stroke();
      }
      
      ctx.draw();
    },
    
    // 触摸结束时重绘，解决某些平台上的刷新问题
    redraw() {
      this.$nextTick(() => {
        this.drawCircle();
      });
    }
  }
}
</script>

<style lang="scss">
.nutrition-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx;
  
  .circle-container {
    position: relative;
    width: 180rpx;
    height: 180rpx;
    margin-bottom: 10rpx;
    
    .circle-canvas {
      width: 100%;
      height: 100%;
    }
    
    .content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none; /* 允许点击穿透到canvas */
      
      .percentage {
        display: flex;
        align-items: flex-start;
        
        .percentage-value {
          font-size: 40rpx;
          font-weight: bold;
          color: #ffffff;
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .percentage-symbol {
          font-size: 20rpx;
          color: #ffffff;
          margin-top: 8rpx;
          line-height: 1;
          opacity: 0.9;
        }
      }
      
      .label {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.95);
        margin-top: 6rpx;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
      }
      
      .value-info {
        font-size: 20rpx;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 6rpx;
      }
    }
  }
  
  .target-info {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }
}
</style> 