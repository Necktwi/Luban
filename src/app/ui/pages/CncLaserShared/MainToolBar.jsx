import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import i18next from 'i18next';
import { includes } from 'lodash';
import Menu from '../../components/Menu';
import SvgIcon from '../../components/SvgIcon';
import i18n from '../../../lib/i18n';
import { actions as projectActions } from '../../../flux/project';
import { actions as editorActions } from '../../../flux/editor';
import Dropdown from '../../components/Dropdown';
import Cnc3DVisualizer from '../../views/Cnc3DVisualizer';
import MainToolBar from '../../layouts/MainToolBar';
import { HEAD_CNC, HEAD_LASER, longLangWithType } from '../../../constants';
import { MACHINE_SERIES } from '../../../constants/machines';
import { actions as laserActions } from '../../../flux/laser';
import { renderModal } from '../../utils';
import LaserSetBackground from '../../widgets/LaserSetBackground';
import LaserCameraAndBackground from '../../widgets/LaserCameraAidBackground';
import ModalSmall from '../../components/Modal/ModalSmall';
import SelectCaptureMode, { MODE_THICKNESS_COMPENSATION } from '../../widgets/LaserCameraAidBackground/SelectCaptureMode';
import MaterialThicknessInput from '../../widgets/LaserCameraAidBackground/MaterialThicknessInput';
import { ConnectionType } from '../../../flux/workspace/state';

function useRenderMainToolBar({ headType, setShowHomePage, setShowJobType, setShowWorkspace }) {
    const unSaved = useSelector(state => state?.project[headType]?.unSaved, shallowEqual);
    const canRedo = useSelector(state => state[headType]?.history?.canRedo, shallowEqual);
    const canUndo = useSelector(state => state[headType]?.history?.canUndo, shallowEqual);
    const isRotate = useSelector(state => state[headType]?.materials?.isRotate, shallowEqual);
    const modelGroup = useSelector(state => state[headType]?.modelGroup, shallowEqual);

    const machineSeries = useSelector(state => state?.machine?.series);
    const machineToolHead = useSelector(state => state?.machine?.toolHead);

    const {
        machineIdentifier: connectedMachineIdentifier,
        headType: workspaceHeadType,
        toolHead: workspaceToolHead,
        isRotate: workspaceIsRotate,
    } = useSelector(state => state.workspace);

    const dispatch = useDispatch();

    const [machineInfo, setMachineInfo] = useState({
        series: machineSeries,
        toolHead: machineToolHead[`${headType}Toolhead`]
    });

    // Laser
    const { connectionType, isConnected } = useSelector(state => state.workspace, shallowEqual);
    const series = useSelector(state => state?.machine?.series, shallowEqual);

    const [cameraCaptureInfo, setCameraCaptureInfo] = useState({
        display: false,
        mode: '',
        materialThickness: null
    });
    const setShowCameraCapture = (show) => {
        modelGroup.unselectAllModels();
        dispatch(editorActions.clearSelection(headType));
        setCameraCaptureInfo({
            display: show,
            mode: '',
            materialThickness: null
        });
    };
    const isOriginalSeries = (series === MACHINE_SERIES.ORIGINAL?.value || series === MACHINE_SERIES.ORIGINAL_LZ?.value);

    // cnc
    const selectedModelArray = useSelector(state => state?.cnc?.modelGroup?.selectedModelArray);
    const selectedAllStl = selectedModelArray.length > 0 && selectedModelArray.every((model) => {
        return model.sourceType === 'image3d';
    });

    const [showStlModal, setShowStlModal] = useState(true);
    useEffect(() => {
        setMachineInfo({
            series: machineSeries,
            toolHead: machineToolHead[`${headType}Toolhead`]
        });
    }, [machineSeries, machineToolHead, headType]);
    function handleHideStlModal() {
        setShowStlModal(false);
    }
    function handleShowStlModal() {
        setShowStlModal(true);
    }
    let menu;
    if (headType === HEAD_CNC) {
        menu = (
            <Menu>
                <Menu.Item
                    onClick={handleShowStlModal}
                    disabled={showStlModal}
                >
                    <div className="align-l width-168">
                        <SvgIcon
                            type="static"
                            disabled={showStlModal}
                            name="MainToolbarAddBackground"
                        />
                        <span
                            className="margin-left-4 height-24 display-inline"
                        >
                            {i18n._('key-CncLaser/MainToolBar-Enable STL 3D View')}
                        </span>

                    </div>
                </Menu.Item>
                <Menu.Item
                    onClick={handleHideStlModal}
                    disabled={!showStlModal}
                >
                    <div className="align-l width-168">
                        <SvgIcon
                            type="static"
                            disabled={!showStlModal}
                            name="MainToolbarRemoverBackground"
                        />
                        <span
                            className="margin-left-4 height-24 display-inline"
                        >
                            {i18n._('key-CncLaser/MainToolBar-Disable STL 3D View')}
                        </span>
                    </div>
                </Menu.Item>
            </Menu>
        );
    } else if (headType === HEAD_LASER) {
        const cameraCaptureEnabled = (() => {
            if (isOriginalSeries) {
                return false;
            }

            return isConnected && connectionType === ConnectionType.WiFi;
        })();
        menu = (
            <Menu>
                <Menu.Item
                    onClick={() => setShowCameraCapture(true)}
                    disabled={!cameraCaptureEnabled}
                >
                    <div className="align-l width-168">
                        <SvgIcon
                            type={['static']}
                            disabled={!cameraCaptureEnabled}
                            name="MainToolbarAddBackground"
                        />
                        <span
                            className="margin-left-4 height-24 display-inline"
                        >
                            {i18n._('key-CncLaser/MainToolBar-Add Background')}
                        </span>
                    </div>
                </Menu.Item>
                <Menu.Item
                    onClick={() => dispatch(laserActions.removeBackgroundImage())}
                >
                    <div className="align-l width-168">
                        <SvgIcon
                            type={['static']}
                            name="MainToolbarRemoverBackground"
                        />
                        <span
                            className="margin-left-4 height-24 display-inline"
                        >
                            {i18n._('key-CncLaser/MainToolBar-Remove Background')}
                        </span>
                    </div>
                </Menu.Item>
            </Menu>
        );
    }
    const leftItems = [
        {
            title: i18n._('key-CncLaser/MainToolBar-Home'),
            type: 'button',
            name: 'MainToolbarHome',
            action: async () => {
                await dispatch(editorActions.onRouterWillLeave(headType));
                setShowHomePage(true);
            }
        },
        {
            title: i18n._('key-CncLaser/MainToolBar-Workspace'),
            type: 'button',
            name: 'MainToolbarWorkspace',
            action: async () => {
                await dispatch(editorActions.onRouterWillLeave(headType));
                setShowWorkspace(true);
            }
        },
        {
            type: 'separator'
        },
        {
            title: i18n._('key-CncLaser/MainToolBar-Save'),
            disabled: !unSaved,
            type: 'button',
            name: 'MainToolbarSave',
            iconClassName: 'cnc-laser-save-icon',
            action: () => {
                dispatch(projectActions.save(headType));
            }
        },
        {
            title: i18n._('key-CncLaser/MainToolBar-Undo'),
            disabled: !canUndo,
            type: 'button',
            name: 'MainToolbarUndo',
            action: () => {
                dispatch(editorActions.undo(headType));
            }
        },
        {
            title: i18n._('key-CncLaser/MainToolBar-Redo'),
            disabled: !canRedo,
            type: 'button',
            name: 'MainToolbarRedo',
            action: () => {
                dispatch(editorActions.redo(headType));
            }
        },
        {
            title: i18n._('key-CncLaser/MainToolBar-Job Setup'),
            type: 'button',
            name: 'MainToolbarJobSetup',
            action: () => {
                setShowJobType(true);
            }
        },
        {
            type: 'separator'
        },
        {
            title: i18n._('key-CncLaser/MainToolBar-Top'),
            type: 'button',
            name: 'MainToolbarTop',
            action: () => {
                dispatch(editorActions.bringSelectedModelToFront(headType));
            }
        },
        {
            title: i18n._('key-CncLaser/MainToolBar-Bottom'),
            type: 'button',
            name: 'MainToolbarBottom',
            action: () => {
                dispatch(editorActions.sendSelectedModelToBack(headType));
            }
        }
    ];
    if (headType === HEAD_CNC) {
        leftItems.push(
            {
                type: 'separator'
            },
            {
                type: 'render',
                customRender: function () {
                    return (
                        <Dropdown
                            className="display-inline align-c padding-horizontal-2 height-50"
                            overlay={menu}
                        >
                            <div
                                className="display-inline font-size-0 v-align-t hover-normal-grey-2 border-radius-4 padding-top-4"
                            >
                                <SvgIcon
                                    name="MainToolbarStl3dView"
                                    type={['static']}
                                >
                                    <div className={`${includes(longLangWithType[i18next.language], headType) ? 'font-size-small' : 'font-size-base'} "color-black-3 height-16"`}>
                                        {i18n._('key-CncLaser/MainToolBar-STL 3D View')}
                                        <SvgIcon
                                            type={['static']}
                                            name="DropdownOpen"
                                            size={20}
                                        />
                                    </div>
                                </SvgIcon>
                            </div>
                        </Dropdown>
                    );
                }
            },
            {
                title: i18n._('key-3DP/MainToolBar-Model repair'),
                disabled: !selectedAllStl,
                type: 'button',
                name: 'MainToolbarFixModel',
                action: () => {
                    dispatch(editorActions.repairSelectedModels(headType));
                }
            }
        );
    }
    if (headType === HEAD_LASER && !isRotate) {
        leftItems.push(
            {
                type: 'separator'
            },
            {
                // MainToolbarCameraCapture
                type: 'render',
                customRender: function () {
                    return (
                        <Dropdown
                            className="display-inline align-c padding-horizontal-2 height-50"
                            overlay={menu}
                        >
                            <div
                                className="display-inline font-size-0 v-align-t hover-normal-grey-2 border-radius-4 padding-top-4"
                            >
                                <SvgIcon
                                    name="MainToolbarCameraCapture"
                                    type={['static']}
                                >
                                    <div className={`${includes(longLangWithType[i18next.language], headType) ? 'font-size-small' : 'font-size-base margin-top-4'} color-black-3 height-16`}>
                                        {i18n._('key-CncLaser/MainToolBar-Camera Capture')}
                                        <SvgIcon
                                            type={['static']}
                                            name="DropdownOpen"
                                            size={20}
                                        />
                                    </div>
                                </SvgIcon>
                            </div>
                        </Dropdown>
                    );
                }
            }
        );
    }

    const materialThickness = useRef(null);
    const setBackgroundModal = cameraCaptureInfo.display && (() => {
        const modalConfig = {
            title: '',
            shouldRenderFooter: true,
            actions: []
        };
        const content = (() => {
            if (!isOriginalSeries && (connectedMachineIdentifier !== machineSeries || workspaceHeadType !== HEAD_LASER
                || machineToolHead.laserToolhead !== workspaceToolHead || workspaceIsRotate)) {
                // todo, ui
                return (
                    <ModalSmall
                        title={i18n._('key-Laser/CameraCapture-diff_setting_error')}
                        text={i18n._('key-Laser/CameraCapture-diff_setting_error_info')}
                        img="WarningTipsWarning"
                        iconColor="#FFA940"
                        onClose={() => { setShowCameraCapture(false); }}
                    />
                );
            }
            if (isOriginalSeries) {
                return (
                    <div>
                        <LaserSetBackground
                            hideModal={() => {
                                setShowCameraCapture(false);
                            }}
                        />
                    </div>
                );
            }

            if (!cameraCaptureInfo.mode) {
                modalConfig.title = i18n._('key-Laser/CameraCapture-Camera Capture');
                modalConfig.shouldRenderFooter = false;
                return (
                    <SelectCaptureMode
                        series={machineInfo.series}
                        onSelectMode={(mode) => {
                            setCameraCaptureInfo((pre) => {
                                return {
                                    ...pre,
                                    mode
                                };
                            });
                        }}
                    />
                );
            }

            if (cameraCaptureInfo.mode === MODE_THICKNESS_COMPENSATION && cameraCaptureInfo.materialThickness === null) {
                modalConfig.title = i18n._('key-Laser/CameraCapture-Camera Capture');
                modalConfig.actions = [{
                    name: i18n._('key-Modal/Common-Next'),
                    isPrimary: true,
                    onClick: () => {
                        setCameraCaptureInfo((pre) => {
                            return {
                                ...pre,
                                materialThickness: materialThickness.current
                            };
                        });
                    }
                }];
                modalConfig.shouldRenderFooter = true;
                return (
                    <MaterialThicknessInput
                        series={machineInfo.series}
                        onChange={(v) => {
                            materialThickness.current = v;
                        }}
                    />
                );
            } else {
                return (
                    <LaserCameraAndBackground
                        mode={cameraCaptureInfo.mode}
                        materialThickness={cameraCaptureInfo.materialThickness}
                        hideModal={() => {
                            setShowCameraCapture(false);
                        }}
                    />
                );
            }
        })();

        return renderModal({
            title: modalConfig.title,
            shouldRenderFooter: modalConfig.shouldRenderFooter,
            actions: modalConfig.actions,
            renderBody() {
                return content;
            },
            onClose: () => { setShowCameraCapture(false); }
        });
    })();
    const renderStlModal = () => {
        return (
            <Cnc3DVisualizer show={showStlModal} />
        );
    };

    return {
        renderStlModal, // cnc
        setBackgroundModal, // laser
        renderMainToolBar: () => {
            return (
                <MainToolBar
                    leftItems={leftItems}
                    lang={i18next.language}
                    headType={headType}
                    // machineInfo={machineInfo}
                    isConnected={isConnected}
                />
            );
        }
    };
}
useRenderMainToolBar.propTypes = {
    headType: PropTypes.string.isRequired,
    setShowHomePage: PropTypes.func,
    setShowJobType: PropTypes.func,
    setShowWorkspace: PropTypes.func
};

export default useRenderMainToolBar;
