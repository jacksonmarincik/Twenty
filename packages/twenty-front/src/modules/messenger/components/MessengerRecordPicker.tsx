import { styled } from '@linaria/react';
import { useMemo, useState } from 'react';
import { IconChevronLeft, IconSearch, IconX } from 'twenty-ui/display';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { MessengerTwentyRecordAttachment } from '@/messenger/types/messenger.types';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

const StyledBackdrop = styled.div`
  background: rgba(0, 0, 0, 0.2);
  inset: 0;
  position: fixed;
  z-index: 1000;
`;

const StyledPopover = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.md};
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  left: 50%;
  max-height: 440px;
  overflow: hidden;
  position: fixed;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 380px;
  z-index: 1001;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledHeaderTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  padding: 0;
  width: 28px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledSearchRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
`;

const StyledSearchInput = styled.input`
  background: transparent;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  outline: none;
`;

const StyledList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[1]};
`;

const StyledListItem = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledItemTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemSubtitle = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]};
  text-align: center;
`;

const StyledItemText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

// Core objects we surface first in the picker. Anything else a user has set
// up will appear below under "More".
const PREFERRED_OBJECT_NAMES = new Set([
  'company',
  'person',
  'opportunity',
  'task',
  'note',
]);

type Props = {
  onCancel: () => void;
  onPick: (attachment: MessengerTwentyRecordAttachment) => void;
};

// Small dumb view when the user has selected an object type but before
// we have fetched records. We render the records list inside a dedicated
// child so `useFindManyRecords` only runs when we know the object name.
type RecordsListProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  search: string;
  onPick: (attachment: MessengerTwentyRecordAttachment) => void;
};

const RecordsList = ({
  objectMetadataItem,
  search,
  onPick,
}: RecordsListProps) => {
  const { records, loading } = useFindManyRecords<ObjectRecord>({
    objectNameSingular: objectMetadataItem.nameSingular,
    limit: 30,
  });

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (needle.length === 0) return records;
    return records.filter((record) => {
      const identifier = getObjectRecordIdentifier({
        objectMetadataItem,
        record,
        allowRequestsToTwentyIcons: false,
      });
      return identifier.name.toLowerCase().includes(needle);
    });
  }, [records, search, objectMetadataItem]);

  if (loading && records.length === 0) {
    return <StyledEmpty>Loading…</StyledEmpty>;
  }

  if (filtered.length === 0) {
    return (
      <StyledEmpty>
        No {objectMetadataItem.labelPlural.toLowerCase()} match "{search}"
      </StyledEmpty>
    );
  }

  return (
    <>
      {filtered.map((record) => {
        const identifier = getObjectRecordIdentifier({
          objectMetadataItem,
          record,
          allowRequestsToTwentyIcons: false,
        });
        const subtitle = buildSubtitle(objectMetadataItem.nameSingular, record);
        return (
          <StyledListItem
            key={record.id as string}
            onClick={() =>
              onPick({
                type: 'twenty_record',
                objectName: objectMetadataItem.nameSingular,
                id: record.id as string,
                label: identifier.name,
                subtitle,
                avatarUrl: identifier.avatarUrl ?? null,
                url: identifier.linkToShowPage ?? null,
              })
            }
            type="button"
          >
            <StyledItemText>
              <StyledItemTitle>{identifier.name}</StyledItemTitle>
              {subtitle ? (
                <StyledItemSubtitle>{subtitle}</StyledItemSubtitle>
              ) : null}
            </StyledItemText>
          </StyledListItem>
        );
      })}
    </>
  );
};

const buildSubtitle = (
  objectNameSingular: string,
  record: ObjectRecord,
): string | null => {
  if (objectNameSingular === 'company') {
    const domain = (record as { domainName?: { primaryLinkUrl?: string } })
      .domainName?.primaryLinkUrl;
    return typeof domain === 'string' && domain.length > 0 ? domain : null;
  }
  if (objectNameSingular === 'person') {
    const email = (record as { emails?: { primaryEmail?: string } })
      .emails?.primaryEmail;
    if (typeof email === 'string' && email.length > 0) return email;
    const jobTitle = (record as { jobTitle?: string }).jobTitle;
    return typeof jobTitle === 'string' && jobTitle.length > 0 ? jobTitle : null;
  }
  if (objectNameSingular === 'opportunity') {
    const stage = (record as { stage?: string }).stage;
    return typeof stage === 'string' && stage.length > 0 ? stage : null;
  }
  return null;
};

export const MessengerRecordPicker = ({ onCancel, onPick }: Props) => {
  const { activeNonSystemObjectMetadataItems } = useFilteredObjectMetadataItems();
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState<string>('');

  const selectedObject = useMemo(
    () =>
      activeNonSystemObjectMetadataItems.find(
        (item) => item.nameSingular === selectedObjectName,
      ) ?? null,
    [activeNonSystemObjectMetadataItems, selectedObjectName],
  );

  const orderedObjects = useMemo(() => {
    const preferred: EnrichedObjectMetadataItem[] = [];
    const others: EnrichedObjectMetadataItem[] = [];
    for (const item of activeNonSystemObjectMetadataItems) {
      if (PREFERRED_OBJECT_NAMES.has(item.nameSingular)) {
        preferred.push(item);
      } else {
        others.push(item);
      }
    }
    preferred.sort(
      (a, b) => a.labelSingular.localeCompare(b.labelSingular),
    );
    others.sort((a, b) => a.labelSingular.localeCompare(b.labelSingular));
    return [...preferred, ...others];
  }, [activeNonSystemObjectMetadataItems]);

  return (
    <>
      <StyledBackdrop onClick={onCancel} />
      <StyledPopover onClick={(event) => event.stopPropagation()}>
        <StyledHeader>
          {selectedObject ? (
            <StyledIconButton
              aria-label="Back"
              onClick={() => {
                setSelectedObjectName(null);
                setSearch('');
              }}
              type="button"
            >
              <IconChevronLeft size={16} />
            </StyledIconButton>
          ) : null}
          <StyledHeaderTitle>
            {selectedObject
              ? `Attach ${selectedObject.labelSingular.toLowerCase()}`
              : 'Attach from CRM'}
          </StyledHeaderTitle>
          <StyledIconButton
            aria-label="Close"
            onClick={onCancel}
            type="button"
          >
            <IconX size={16} />
          </StyledIconButton>
        </StyledHeader>
        {selectedObject ? (
          <>
            <StyledSearchRow>
              <IconSearch size={14} />
              <StyledSearchInput
                autoFocus
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${selectedObject.labelPlural.toLowerCase()}…`}
                value={search}
              />
            </StyledSearchRow>
            <StyledList>
              <RecordsList
                objectMetadataItem={selectedObject}
                onPick={onPick}
                search={search}
              />
            </StyledList>
          </>
        ) : (
          <StyledList>
            {orderedObjects.length === 0 ? (
              <StyledEmpty>No CRM objects available</StyledEmpty>
            ) : (
              orderedObjects.map((item) => (
                <StyledListItem
                  key={item.nameSingular}
                  onClick={() => setSelectedObjectName(item.nameSingular)}
                  type="button"
                >
                  <StyledItemText>
                    <StyledItemTitle>{item.labelPlural}</StyledItemTitle>
                    {item.description ? (
                      <StyledItemSubtitle>{item.description}</StyledItemSubtitle>
                    ) : null}
                  </StyledItemText>
                </StyledListItem>
              ))
            )}
          </StyledList>
        )}
      </StyledPopover>
    </>
  );
};
