import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Link from 'next/link';
import { useDebouncedCallback } from 'use-debounce';

// components
import Map from 'components/map';
import Drawer from 'components/map/plugins/drawer';
import MapControls from 'components/map/controls';
import ZoomControls from 'components/map/controls/zoom';
import DrawPolygonControls from 'components/map/controls/draw-polygon';
import CustomSelect from 'components/ui/CustomSelect';
import Spinner from 'components/ui/Spinner';
import Field from 'components/form/Field';
import Input from 'components/form/Input';
import UploadArea from 'components/areas/UploadArea';

// hooks
import useCountries from 'hooks/countries/countries';

// constants
import { DEFAULT_VIEWPORT, MAPSTYLES } from 'components/map/constants';

const AreasForm = ({
  area,
  onSubmit,
}) => {
  const drawer = useRef(null);
  const [mapState, setMapState] = useState({
    viewport: DEFAULT_VIEWPORT,
    isDrawing: false,
  });
  const [form, setForm] = useState({
    name: area ? area.name : '',
    geostore: area ? area.geostore : '',
    geojson: null,
  });
  const {
    data: countries,
    isFetching: countriesLoading,
  } = useCountries();

  const handleSubmit = useCallback((evt) => {
    evt.preventDefault();

    onSubmit(form);
  }, [form, onSubmit]);

  const onChangeSelectedArea = useCallback((value) => {
    if (typeof value === 'undefined') {
      setForm((prevFormState) => ({
        ...prevFormState,
        geostore: null,
        geoCountrySelected: false,
      }));
      return null;
    }

    setForm((prevFormState) => ({
      ...prevFormState,
      geostore: value.value,
      geoCountrySelected: true,
    }));

    return true;
  }, []);

  const onUploadArea = useCallback((id) => {
    setForm((prevFormState) => ({
      ...prevFormState,
      geostore: id,
    }));
  }, []);

  const handleNameChange = useCallback((value) => {
    setForm((prevFormState) => ({
      ...prevFormState,
      name: value,
    }));
  }, []);

  const [handleViewport] = useDebouncedCallback((viewport) => {
    setMapState((prevMapState) => ({
      ...prevMapState,
      viewport,
    }));
  }, 250);

  const handleZoom = useCallback((zoom) => {
    setMapState((prevMapState) => ({
      ...prevMapState,
      zoom,
      // transitionDuration is always set to avoid mixing
      // durations of other actions (like flying)
      transitionDuration: 250,
    }));
  }, []);

  const handleMapCursor = useCallback(({ isHovering, isDragging }) => {
    const { isDrawing } = mapState;

    if (isDrawing && isDragging) return 'grabbing';
    if (isDrawing) return 'crosshair';
    if (isHovering) return 'pointer';

    return 'grab';
  }, [mapState]);

  const handleDrawerReady = useCallback((ref) => { drawer.current = ref; }, []);

  const handleDrawerEscapeKey = useCallback(() => {
    setMapState((prevMapState) => ({
      ...prevMapState,
      isDrawing: false,
    }));
  }, []);

  const handleDrawPolygon = useCallback(() => {
    setMapState((prevMapState) => ({
      ...prevMapState,
      isDrawing: !prevMapState.isDrawing,
    }));
  }, []);

  const handleRemovePolygon = useCallback(() => {
    const { current: drawerRef } = drawer;
    if (!drawerRef) return null;

    drawerRef.deleteAll();
    drawerRef.changeMode('draw_polygon');

    return drawerRef;
  }, []);

  const handleDrawComplete = useCallback((geojson) => {
    setForm((prevFormState) => ({
      ...prevFormState,
      geojson,
    }));
  }, []);

  const mapClass = classnames({ 'no-pointer-events': mapState.isDrawing });

  const countryOptions = useMemo(() => countries
    .filter(({ name }) => !!name)
    .map(({ name, geostoreId }) => ({
      label: name,
      value: geostoreId,
    })),
  [countries]);

  return (
    <div className="c-areas-form">
      <form
        className="c-form"
        onSubmit={handleSubmit}
      >
        <fieldset className="c-field-container">
          <Field
            onChange={handleNameChange}
            validations={['required']}
            properties={{
              name: 'name',
              label: 'Title',
              type: 'text',
              value: form.name,
              default: form.name,
              required: true,
            }}
          >
            {Input}
          </Field>
        </fieldset>

        <div className="c-field selectors-container">
          <CustomSelect
            placeholder="Select area"
            options={countryOptions}
            onValueChange={onChangeSelectedArea}
            allowNonLeafSelection={false}
            value={form.geostore}
            waitForChangeConfirmation
            disabled={!!area}
          />
        </div>

        {(form.geostore && form.geoCountrySelected) && (
          <span className="c-field__helpMessage">
            If you want to draw/upload a custom area, remove the selected area above.
          </span>
        )}

        {(!form.geostore || !form.geoCountrySelected) && (!area) && (
          <div className="c-field">
            <p>Draw Area</p>
            <div className="c-field__map--container">
              {countriesLoading && (
                <Spinner
                  isLoading
                  className="-light"
                />
              )}
              <Map
                mapboxApiAccessToken={process.env.RW_MAPBOX_API_TOKEN}
                mapStyle={MAPSTYLES}
                viewport={mapState.viewport}
                basemap="dark"
                onViewportChange={handleViewport}
                getCursor={handleMapCursor}
                className={mapClass}
              >
                {(_map) => (
                  <Drawer
                    map={_map}
                    drawing={mapState.isDrawing}
                    onEscapeKey={handleDrawerEscapeKey}
                    onReady={handleDrawerReady}
                    onDrawComplete={handleDrawComplete}
                  />
                )}
              </Map>
              <MapControls>
                <ZoomControls
                  viewport={mapState.viewport}
                  onClick={handleZoom}
                />
                <DrawPolygonControls
                  drawing={mapState.isDrawing}
                  onDrawPolygon={handleDrawPolygon}
                  onRemovePolygon={handleRemovePolygon}
                  showRemovePolygonButton={mapState.isDrawing}
                />
              </MapControls>
            </div>
          </div>
        )}

        {(!form.geostore || !form.geoCountrySelected) && !area && (
          <UploadArea onUploadArea={onUploadArea} />
        )}

        <div className="c-button-container -full-width -j-end">
          <ul>
            <li>
              <Link
                href="/myrw/areas"
              >
                <button
                  type="button"
                  className="c-btn -secondary"
                >
                  Cancel
                </button>
              </Link>
            </li>
            <li>
              <button
                type="submit"
                className="c-btn -primary"
              >
                Submit
              </button>
            </li>
          </ul>
        </div>
      </form>
    </div>
  );
};

AreasForm.defaultProps = {
  area: null,
};

AreasForm.propTypes = {
  area: PropTypes.shape({
    name: PropTypes.string.isRequired,
    geostore: PropTypes.string.isRequired,
  }),
  onSubmit: PropTypes.func.isRequired,
};

export default AreasForm;
