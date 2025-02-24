import React, { FC, useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  TextStyle,
  Text,
  TouchableWithoutFeedback,
  PanResponder,
  PanResponderInstance,
  Dimensions,
  PanResponderGestureState,
} from "react-native";

const dims = Dimensions.get("window");

export interface ToastOptions {
  /**
   * Id is optional, you may provide an id only if you want to update toast later using toast.update()
   */
  id?: string;

  /**
   * Customize Toast icon
   */
  icon?: JSX.Element;

  /**
   * Toast types, You can implement you custom type with JSX using renderType method on ToastContainer
   */
  type?: "normal" | "success" | "danger" | "warning" | string;

  /**
   * In milliseconds, How long toast will stay before it go away
   */
  duration?: number;

  /**
   * Customize when toast should be placed
   */
  placement?: "top" | "bottom";

  /**
   * Customize style of toast
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Customize style of toast text
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Customize how fast toast will show and hide
   */
  animationDuration?: number;

  /**
   * Customize how toast is animated when added or removed
   */
  animationType?: "slide-in" | "zoom-in";

  /**
   * Customize success type icon
   */
  successIcon?: JSX.Element;

  /**
   * Customize danger type icon
   */
  dangerIcon?: JSX.Element;

  /**
   * Customize warning type icon
   */
  warningIcon?: JSX.Element;

  /**
   * Customize success type color. changes toast background color
   */
  successColor?: string;

  /**
   * Customize danger type color. changes toast background color
   */
  dangerColor?: string;

  /**
   * Customize warning type color. changes toast background color
   */
  warningColor?: string;

  /**
   * Customize normal type color. changes toast background color
   */
  normalColor?: string;

  /**
   * Register event for when toast is pressed. If you're using a custom toast you have to pass this to a Touchable.
   */
  onPress?(id: string): void;

  /**
   * payload data for custom toasts. You can pass whatever you want
   *
   */
  data?: any;
}

export interface ToastProps extends ToastOptions {
  id: string;
  onClose(): void;
  message: string | JSX.Element;
  renderToast?(toast: ToastProps): JSX.Element;
  renderType?: { [type: string]: (toast: ToastProps) => JSX.Element };
}

const Toast: FC<ToastProps> = (props) => {
  let {
    id,
    onClose,
    icon,
    type = "normal",
    message,
    duration = 5000,
    style,
    textStyle,
    animationDuration = 250,
    animationType = "slide-in",
    successIcon,
    dangerIcon,
    warningIcon,

    successColor,
    dangerColor,
    warningColor,
    normalColor,

    placement,

    onPress,
  } = props;

  const containerRef = useRef<View>(null);
  const [animation] = useState(new Animated.Value(0));
  const panResponderRef = useRef<PanResponderInstance>();
  const panResponderAnimRef = useRef<Animated.ValueXY>();

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      useNativeDriver: true,
      duration: animationDuration,
    }).start();

    let closeTimeout: NodeJS.Timeout | null = null;

    if (duration !== 0 && typeof duration === "number") {
      closeTimeout = setTimeout(() => {
        Animated.timing(animation, {
          toValue: 0,
          useNativeDriver: true,
          duration: animationDuration,
        }).start(() => onClose());
      }, duration);
    }

    return () => {
      closeTimeout && clearTimeout(closeTimeout);
    };
  }, []);

  const panReleaseToLeft = (gestureState: PanResponderGestureState) => {
    Animated.timing(getPanResponderAnim(), {
      toValue: { x: (-dims.width / 10) * 9, y: gestureState.dy },
      useNativeDriver: true,
      duration: 250,
    }).start(() => onClose());
  };

  const panReleaseToRight = (gestureState: PanResponderGestureState) => {
    Animated.timing(getPanResponderAnim(), {
      toValue: { x: (dims.width / 10) * 9, y: gestureState.dy },
      useNativeDriver: true,
      duration: 250,
    }).start(() => onClose());
  };

  const getPanResponder = () => {
    if (panResponderRef.current) return panResponderRef.current;
    panResponderRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        //return true if user is swiping, return false if it's a single click
        return !(gestureState.dx === 0 && gestureState.dy === 0);
      },
      onPanResponderMove: (_, gestureState) => {
        getPanResponderAnim()?.setValue({
          x: gestureState.dx,
          y: gestureState.dy,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          panReleaseToRight(gestureState);
        } else if (gestureState.dx < -50) {
          panReleaseToLeft(gestureState);
        } else {
          Animated.spring(getPanResponderAnim(), {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    });
    return panResponderRef.current;
  };

  const getPanResponderAnim = () => {
    if (panResponderAnimRef.current) return panResponderAnimRef.current;
    panResponderAnimRef.current = new Animated.ValueXY({ x: 0, y: 0 });
    return panResponderAnimRef.current;
  };

  if (icon === undefined) {
    switch (type) {
      case "success": {
        if (successIcon) {
          icon = successIcon;
        }
        break;
      }

      case "danger": {
        if (dangerIcon) {
          icon = dangerIcon;
        }
        break;
      }
      case "warning": {
        if (warningIcon) {
          icon = warningIcon;
        }
        break;
      }
    }
  }

  let backgroundColor = "";
  switch (type) {
    case "success":
      backgroundColor = successColor || "#00C851";
      break;
    case "danger":
      backgroundColor = dangerColor || "#ff4444";
      break;
    case "warning":
      backgroundColor = warningColor || "#ffbb33";
      break;
    default:
      backgroundColor = normalColor || "#333";
  }

  const animationStyle: Animated.WithAnimatedObject<ViewStyle> = {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: placement === "bottom" ? [20, 0] : [-20, 0], // 0 : 150, 0.5 : 75, 1 : 0
        }),
      },
      getPanResponderAnim().getTranslateTransform()[0],
    ],
  };

  if (animationType === "zoom-in") {
    animationStyle.transform?.push({
      scale: animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.7, 1],
      }),
    });
  }

  return (
    <Animated.View
      ref={containerRef}
      {...getPanResponder().panHandlers}
      style={[styles.container, animationStyle]}
    >
      {props.renderType && props.renderType[type] ? (
        props.renderType[type](props)
      ) : props.renderToast ? (
        props.renderToast(props)
      ) : (
        <TouchableWithoutFeedback
          disabled={!onPress}
          onPress={() => onPress && onPress(id)}
        >
          <View style={[styles.toastContainer, { backgroundColor }, style]}>
            {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
            {React.isValidElement(message) ? (
              message
            ) : (
              <Text style={[styles.message, textStyle]}>{message}</Text>
            )}
          </View>
        </TouchableWithoutFeedback>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center" },
  toastContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 5,
    marginVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: (dims.width / 10) * 9,
    overflow: "hidden",
  },
  message: {
    color: "#fff",
    fontWeight: "500",
  },
  iconContainer: {
    marginRight: 5,
  },
});

export default Toast;
